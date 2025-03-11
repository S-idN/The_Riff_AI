from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
from rest_framework.permissions import IsAuthenticated
from django.views.decorators.csrf import csrf_exempt
import urllib.parse
import requests
import os

# URLs for FastAPI services
USER_INPUT_API_URL = "http://127.0.0.1:8001/user_input"  # Fix the endpoint
GEOIP_API_URL = "http://127.0.0.1:8001/geoip/"
FASTAPI_URL = "http://127.0.0.1:8001/user_input/analyze_audio"
FASTAPI_URL_TEXT = "http://127.0.0.1:8001/user_input/analyze_text"
LASTFM_API_KEY = "6c237b08ecb776685d6b1dbea19210ad"

from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import requests
import json

MOOD_EMOTION_TAGS = {
    "positive": ["happy", "upbeat", "feel-good"],
    "negative": ["dark", "moody"],
    "neutral": ["chill", "calm", "ambient"],
    "joy": ["cheerful", "uplifting", "dance"],
    "sadness": ["sad", "melancholic", "emotional"],
    "anger": ["aggressive", "rage", "hard rock"],
    "fear": ["dark", "haunting", "cinematic"],
    "disgust": ["distorted", "grunge", "raw"]
}

@csrf_exempt
def get_song_recommendation(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            text = data.get("text", "").strip()

            if not text:
                return JsonResponse({"error": "Text input is required"}, status=400)

            text = urllib.parse.quote(text)

            # Step 1️⃣: Call FastAPI to analyze the text
            fastapi_response = requests.post(f"{USER_INPUT_API_URL}/analyze_text?text={text}")
            fastapi_response.raise_for_status()
            analysis_result = fastapi_response.json()

            mood = analysis_result.get("mood", "")
            emotion = analysis_result.get("emotion", "")
            tags = list(set(MOOD_EMOTION_TAGS.get(mood, []) + MOOD_EMOTION_TAGS.get(emotion, [])))

            # Step 2️⃣: Get user's country & region using fetch_geoip
            geoip_request = request  # Pass the current request to reuse IP detection logic
            geoip_response = fetch_geoip(geoip_request)

            if geoip_response.status_code == 200:
                geoip_data = json.loads(geoip_response.content)
                country = geoip_data.get("country", "United States")  # Default to US
                region = geoip_data.get("region", "")
            else:
                country, region = "United States", ""

            print(f"User location: {country}, {region}")

            recommendations = []

            # Step 3️⃣: Fetch region-based trending songs from Last.fm
            if country:
                geo_url = f"http://ws.audioscrobbler.com/2.0/?method=geo.gettoptracks&country={urllib.parse.quote(country)}&api_key={LASTFM_API_KEY}&format=json"
                geo_response = requests.get(geo_url).json()
                geo_tracks = geo_response.get("tracks", {}).get("track", [])

                recommendations.extend([
                    {"title": track["name"], "artist": track["artist"]["name"], "url": track["url"]}
                    for track in geo_tracks[:3]  # Get top 3 trending tracks
                ])

            # Step 4️⃣: Fetch additional songs based on mood/emotion tags
            if tags:
                for tag in tags:
                    search_url = f"http://ws.audioscrobbler.com/2.0/?method=tag.gettoptracks&tag={urllib.parse.quote(tag)}&api_key={LASTFM_API_KEY}&format=json"
                    search_response = requests.get(search_url).json()
                    tracks = search_response.get("tracks", {}).get("track", [])

                    recommendations.extend([
                        {"title": track["name"], "artist": track["artist"]["name"], "url": track["url"]}
                        for track in tracks[:3]  # Get top 3 per tag
                    ])

                    if len(recommendations) >= 10:  # Limit results
                        break  

            if not recommendations:
                return JsonResponse({"error": "No songs found for the given input"}, status=404)

            return JsonResponse({
                "analysis": analysis_result,
                "tags_used": tags,
                "location": {"country": country, "region": region},
                "recommendations": recommendations[:10]
            })

        except requests.exceptions.RequestException as e:
            return JsonResponse({"error": f"API request error: {str(e)}"}, status=502)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON input"}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=400)

@api_view(["POST"])
def analyze_text(request):
    """Forward text input to FastAPI user input service using query parameters."""
    try:
        text = request.GET.get("text", "").strip()  # Get text from query params
        if not text:
            return Response({"error": "Text input is required"}, status=status.HTTP_400_BAD_REQUEST)

        response = requests.post(f"{USER_INPUT_API_URL}/analyze_text?text={text}")
        response.raise_for_status()
        return Response(response.json())
    
    except requests.exceptions.RequestException as e:
        return Response({"error": f"FastAPI service error: {str(e)}"}, status=status.HTTP_502_BAD_GATEWAY)




@api_view(["POST"])
def analyze_audio(request):
    """Forward audio file to FastAPI"""
    if "file" not in request.FILES:
        return JsonResponse({"error": "Audio file is required"}, status=400)

    file = request.FILES["file"]
    files = {"file": (file.name, file, file.content_type)}

    try:
        response = requests.post(FASTAPI_URL, files=files)
        return JsonResponse(response.json(), status=response.status_code)
    except requests.RequestException as e:
        return JsonResponse({"error": f"Failed to connect to FastAPI: {e}"}, status=502)
    

@api_view(["GET", "POST"])
def fetch_geoip(request):
    """
    Get the user's IP address and fetch location data from the FastAPI GeoIP service.
    """

    # 1️⃣ First, check if an IP is explicitly provided (GET or POST)
    ip = request.GET.get("ip")  # GET request query param
    if request.method == "POST":
        ip = request.data.get("ip")  # JSON body for POST requests

    # 2️⃣ If no IP is provided, try to detect the real client IP
    if not ip:
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip = x_forwarded_for.split(",")[0]  # Get the first IP in the list
        else:
            ip = request.META.get("REMOTE_ADDR")  # Fallback to REMOTE_ADDR

    # 3️⃣ Handle cases where the detected IP is localhost (127.0.0.1 or ::1)
    if ip in ["127.0.0.1", "::1"]:
        try:
            # Fetch the real external IP (for local development)
            response = requests.get("https://api64.ipify.org?format=json", timeout=5)
            ip = response.json().get("ip", "8.8.8.8")  # Fallback to 8.8.8.8 if the request fails
        except requests.exceptions.RequestException:
            ip = "8.8.8.8"  # Default to Google's public DNS

    # 4️⃣ Query the FastAPI GeoIP service with the resolved IP
    url = f"{GEOIP_API_URL}?ip={ip}"
    try:
        response = requests.get(url, timeout=10)
        print(f"Fetching GeoIP for IP: {ip} from {url} -> Status: {response.status_code}")

        if response.status_code != 200:
            return JsonResponse({"error": f"FastAPI error {response.status_code}"}, status=response.status_code)

        return JsonResponse(response.json())

    except requests.exceptions.RequestException as e:
        print("GeoIP fetch error:", e)
        return JsonResponse({"error": "Failed to connect to GeoIP service"}, status=500)