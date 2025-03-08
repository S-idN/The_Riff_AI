from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
import requests
import os

# URLs for FastAPI services
USER_INPUT_API_URL = os.getenv("USER_INPUT_API_URL", "http://127.0.0.1:8000/user_input/")
GEOIP_API_URL = os.getenv("GEOIP_API_URL", "http://127.0.0.1:8000/geoip/")

def get_client_ip(request):
    """Extract user's IP address from request headers."""
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0]  # First IP in list (original client)
    else:
        ip = request.META.get("REMOTE_ADDR")  # Direct remote address
    return ip


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def analyze_text(request):
    """Forward text input to FastAPI user input service."""
    try:
        text = request.data.get("text", "").strip()
        if not text:
            return Response({"error": "Text input is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        response = requests.post(f"{USER_INPUT_API_URL}/analyze_text", json={"text": text})
        response.raise_for_status()
        return Response(response.json())
    
    except requests.exceptions.RequestException as e:
        return Response({"error": f"FastAPI service error: {str(e)}"}, status=status.HTTP_502_BAD_GATEWAY)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def analyze_audio(request):
    """Forward audio file to FastAPI user input service."""
    try:
        if "file" not in request.FILES:
            return Response({"error": "Audio file is required"}, status=status.HTTP_400_BAD_REQUEST)

        file = request.FILES["file"]
        files = {"file": (file.name, file, file.content_type)}

        response = requests.post(f"{USER_INPUT_API_URL}/analyze_audio", files=files)
        response.raise_for_status()
        return Response(response.json())

    except requests.exceptions.RequestException as e:
        return Response({"error": f"FastAPI service error: {str(e)}"}, status=status.HTTP_502_BAD_GATEWAY)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def fetch_geoip(request):
    """
    Fetch GeoIP data using user's real IP unless disabled.
    Query param `disable_geoip=true` disables GeoIP fetching.
    """
    try:
        disable_geoip = request.GET.get("disable_geoip", "false").lower() == "true"
        if disable_geoip:
            return Response({"geoip_disabled": True, "location": None})

        user_ip = get_client_ip(request)
        if not user_ip:
            return Response({"error": "Could not detect IP"}, status=status.HTTP_400_BAD_REQUEST)

        response = requests.get(f"{GEOIP_API_URL}", params={"ip": user_ip})
        response.raise_for_status()
        return Response(response.json())

    except requests.exceptions.RequestException as e:
        return Response({"error": f"FastAPI service error: {str(e)}"}, status=status.HTTP_502_BAD_GATEWAY)
