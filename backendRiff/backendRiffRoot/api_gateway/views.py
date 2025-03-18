from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
import requests
import os
import random

# URLs for FastAPI services - get from settings
from django.conf import settings

# Get URLs from settings
USER_INPUT_API_URL = settings.USER_INPUT_API_URL
GEOIP_API_URL = settings.GEOIP_API_URL
LASTFM_API_URL = settings.LASTFM_API_URL

# Create mood-based song libraries
HAPPY_SONGS = [
    {"name": "Happy", "artist": "Pharrell Williams", "url": "https://www.last.fm/music/Pharrell+Williams/_/Happy", "spotify_url": "https://open.spotify.com/track/60nZcImufyMA1MKQZ2Bm3n", "image_url": "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png"},
    {"name": "Don't Stop Me Now", "artist": "Queen", "url": "https://www.last.fm/music/Queen/_/Don%27t+Stop+Me+Now", "spotify_url": "https://open.spotify.com/track/7hQJA50XrCWABAu5v6QZ4i", "image_url": "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png"},
    {"name": "Good as Hell", "artist": "Lizzo", "url": "https://www.last.fm/music/Lizzo/_/Good+as+Hell", "spotify_url": "https://open.spotify.com/track/3Yh9lZcWyKrK9GjbhuS0hR", "image_url": "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png"},
    {"name": "Walking on Sunshine", "artist": "Katrina & The Waves", "url": "https://www.last.fm/music/Katrina+&+The+Waves/_/Walking+on+Sunshine", "spotify_url": "https://open.spotify.com/track/05wIrZSwuaVWhcv5FfqeH0", "image_url": "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png"},
    {"name": "Uptown Funk", "artist": "Mark Ronson ft. Bruno Mars", "url": "https://www.last.fm/music/Mark+Ronson/_/Uptown+Funk", "spotify_url": "https://open.spotify.com/track/32OlwWuMpZ6b0aN2RZOeMS", "image_url": "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png"},
    {"name": "Can't Stop the Feeling!", "artist": "Justin Timberlake", "url": "https://www.last.fm/music/Justin+Timberlake/_/Can%27t+Stop+the+Feeling%21", "spotify_url": "https://open.spotify.com/track/1WkMMavIMc4JZ8cfMmxHkI", "image_url": "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png"},
    {"name": "I Gotta Feeling", "artist": "Black Eyed Peas", "url": "https://www.last.fm/music/Black+Eyed+Peas/_/I+Gotta+Feeling", "spotify_url": "https://open.spotify.com/track/4JehYebiI9JE8sR8MisGVb", "image_url": "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png"}
]

SAD_SONGS = [
    {"name": "Someone Like You", "artist": "Adele", "url": "https://www.last.fm/music/Adele/_/Someone+Like+You", "spotify_url": "https://open.spotify.com/track/3LkSiHbjqOHCKCVBEB88h2", "image_url": "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png"},
    {"name": "Hurt", "artist": "Johnny Cash", "url": "https://www.last.fm/music/Johnny+Cash/_/Hurt", "spotify_url": "https://open.spotify.com/track/3aRgAfrt6aLLFophHxA7Fw", "image_url": "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png"},
    {"name": "Nothing Compares 2 U", "artist": "Sinéad O'Connor", "url": "https://www.last.fm/music/Sin%C3%A9ad+O%27Connor/_/Nothing+Compares+2+U", "spotify_url": "https://open.spotify.com/track/1nFtiJxYdhtFfFtfXBv06s", "image_url": "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png"},
    {"name": "Everybody Hurts", "artist": "R.E.M.", "url": "https://www.last.fm/music/R.E.M./_/Everybody+Hurts", "spotify_url": "https://open.spotify.com/track/6PypGyiu0Y2lCDBN5sbtS4", "image_url": "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png"},
    {"name": "Fix You", "artist": "Coldplay", "url": "https://www.last.fm/music/Coldplay/_/Fix+You", "spotify_url": "https://open.spotify.com/track/7LVHVU3tWfcxj5aiPFEW4Q", "image_url": "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png"},
    {"name": "Skinny Love", "artist": "Bon Iver", "url": "https://www.last.fm/music/Bon+Iver/_/Skinny+Love", "spotify_url": "https://open.spotify.com/track/4fbvXwMi4fL56PwNvAnKnZ", "image_url": "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png"},
    {"name": "Mad World", "artist": "Gary Jules", "url": "https://www.last.fm/music/Gary+Jules/_/Mad+World", "spotify_url": "https://open.spotify.com/track/3JOVTQ5h8HGFnDdp4VT3MP", "image_url": "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png"}
]

CHILL_SONGS = [
    {"name": "Watermelon Sugar", "artist": "Harry Styles", "url": "https://www.last.fm/music/Harry+Styles/_/Watermelon+Sugar", "spotify_url": "https://open.spotify.com/track/6UelLqGlWMcVH1E5c4H7lY", "image_url": "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png"},
    {"name": "Sunday Morning", "artist": "Maroon 5", "url": "https://www.last.fm/music/Maroon+5/_/Sunday+Morning", "spotify_url": "https://open.spotify.com/track/0j5QKkgh5VwqmzZMZWhXQK", "image_url": "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png"},
    {"name": "Don't Worry Be Happy", "artist": "Bobby McFerrin", "url": "https://www.last.fm/music/Bobby+McFerrin/_/Don%27t+Worry+Be+Happy", "spotify_url": "https://open.spotify.com/track/4hObp5bmIJ3PP3cKA9K9GY", "image_url": "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png"},
    {"name": "Three Little Birds", "artist": "Bob Marley & The Wailers", "url": "https://www.last.fm/music/Bob+Marley+&+The+Wailers/_/Three+Little+Birds", "spotify_url": "https://open.spotify.com/track/6A9mKXlFRPMPPLaYXGVJQK", "image_url": "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png"},
    {"name": "Banana Pancakes", "artist": "Jack Johnson", "url": "https://www.last.fm/music/Jack+Johnson/_/Banana+Pancakes", "spotify_url": "https://open.spotify.com/track/451GvHwY99NKV4zdKPRWmv", "image_url": "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png"},
    {"name": "Island In The Sun", "artist": "Weezer", "url": "https://www.last.fm/music/Weezer/_/Island+In+The+Sun", "spotify_url": "https://open.spotify.com/track/2MLHyLy5z5l5YRp7momlgw", "image_url": "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png"},
    {"name": "Sunrise", "artist": "Norah Jones", "url": "https://www.last.fm/music/Norah+Jones/_/Sunrise", "spotify_url": "https://open.spotify.com/track/0Mb9aMlRFTlgCZRmKnV8tG", "image_url": "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png"}
]

ENERGETIC_SONGS = [
    {"name": "Can't Hold Us", "artist": "Macklemore & Ryan Lewis", "url": "https://www.last.fm/music/Macklemore+&+Ryan+Lewis/_/Can%27t+Hold+Us", "spotify_url": "https://open.spotify.com/track/3bidbhpOYeV4knp8AIu8Xn", "image_url": "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png"},
    {"name": "Wake Me Up", "artist": "Avicii", "url": "https://www.last.fm/music/Avicii/_/Wake+Me+Up", "spotify_url": "https://open.spotify.com/track/4h8VwCb1aGoJxiGLW3Gaz5", "image_url": "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png"},
    {"name": "Shake It Off", "artist": "Taylor Swift", "url": "https://www.last.fm/music/Taylor+Swift/_/Shake+It+Off", "spotify_url": "https://open.spotify.com/track/0cqRj7pUJDkTCEsJkx8snD", "image_url": "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png"},
    {"name": "Eye of the Tiger", "artist": "Survivor", "url": "https://www.last.fm/music/Survivor/_/Eye+of+the+Tiger", "spotify_url": "https://open.spotify.com/track/2KH16WveTQWT6KOG9Rg6e2", "image_url": "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png"},
    {"name": "Levels", "artist": "Avicii", "url": "https://www.last.fm/music/Avicii/_/Levels", "spotify_url": "https://open.spotify.com/track/5UqCQaDshqbIk3pkhy4Pjg", "image_url": "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png"},
    {"name": "Don't Stop Believin'", "artist": "Journey", "url": "https://www.last.fm/music/Journey/_/Don%27t+Stop+Believin%27", "spotify_url": "https://open.spotify.com/track/4bHsxqR3GMrXTxEPLuK5ue", "image_url": "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png"},
    {"name": "Till I Collapse", "artist": "Eminem", "url": "https://www.last.fm/music/Eminem/_/Till+I+Collapse", "spotify_url": "https://open.spotify.com/track/4xkOaSrkexMciUUogZKVTS", "image_url": "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png"}
]

def get_client_ip(request):
    """Extract user's IP address from request headers."""
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0]  # First IP in list (original client)
    else:
        ip = request.META.get("REMOTE_ADDR")  # Direct remote address
    return ip


@api_view(["POST"])
def analyze_text(request):
    """Forward text input to FastAPI user input service."""
    try:
        text = request.data.get("text", "").strip()
        if not text:
            return Response({"error": "Text input is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Print the URL we're calling for debugging
        print(f"Calling FastAPI at: {USER_INPUT_API_URL}/analyze_text")
        
        try:
            # Try to connect to FastAPI - use params instead of json
            # The FastAPI endpoint expects text as a query parameter, not in JSON body
            response = requests.post(
                f"{USER_INPUT_API_URL}/analyze_text", 
                params={"text": text},  # Changed from json to params
                timeout=5
            )
            
            # Print response status for debugging
            print(f"FastAPI response status: {response.status_code}")
            
            # If response has content but was an error, print it for debugging
            if not response.ok and response.content:
                print(f"FastAPI error response: {response.content}")
                
            response.raise_for_status()
            return Response(response.json())
        except Exception as conn_error:
            print(f"Connection error: {str(conn_error)}")
            # If FastAPI is down, return mock data instead
            print("FastAPI might be down, using mock data instead")
            return Response({
                "mood": "neutral" if "happy" not in text.lower() else "positive",
                "emotion": "joy" if "happy" in text.lower() else "neutral",
                "intent_context_embedding": [0.0] * 10  # Simplified embedding
            })
    
    except requests.exceptions.RequestException as e:
        print(f"FastAPI service error: {str(e)}")
        return Response({"error": f"FastAPI service error: {str(e)}"}, status=status.HTTP_502_BAD_GATEWAY)


@api_view(["POST"])
def mock_analyze_text(request):
    """A mock endpoint that doesn't rely on FastAPI."""
    text = request.data.get("text", "").strip()
    if not text:
        return Response({"error": "Text input is required"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Simple mock analysis
    is_positive = any(word in text.lower() for word in ["happy", "good", "great", "joy", "love", "excited", "cheerful"])
    is_negative = any(word in text.lower() for word in ["sad", "bad", "hate", "angry", "upset", "depressed", "tired"])
    is_calm = any(word in text.lower() for word in ["calm", "relaxed", "chill", "peaceful", "quiet", "zen"])
    is_energetic = any(word in text.lower() for word in ["energy", "workout", "dance", "pumped", "power", "run"])
    
    # Determine mood (consistent with FastAPI service outputs)
    if is_positive:
        mood = "positive"
    elif is_negative:
        mood = "negative"
    elif is_calm:
        mood = "neutral"
    elif is_energetic:
        mood = "neutral"  # FastAPI service doesn't have an "energetic" mood option
    else:
        mood = "neutral"
    
    # Determine emotion (consistent with FastAPI service outputs)
    if is_positive:
        emotion = "joy"
    elif is_negative:
        emotion = "sadness"
    elif is_calm:
        emotion = "neutral" 
    elif is_energetic:
        emotion = "neutral"  # For consistency, though ideally this could be "excited"
    else:
        emotion = "neutral"
    
    # Create mock embedding - smaller size to save bandwidth
    embedding = [0.0] * 10  # Simplified embedding
    
    print(f"Mock analysis results - Mood: {mood}, Emotion: {emotion}")
    
    return Response({
        "mood": mood,
        "emotion": emotion,
        "intent_context_embedding": embedding
    })


@api_view(["POST"])
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


@api_view(["POST"])
def get_song_recommendations(request):
    """Forward song recommendation request to FastAPI Last.fm service."""
    try:
        # Get text input, emotion, and mood from request
        payload = {
            "query": request.data.get("query", "").strip(),
            "emotion": request.data.get("emotion"),
            "mood": request.data.get("mood")
        }
        
        # Ensure at least one of query, emotion, or mood is provided
        if not any(payload.values()):
            return Response(
                {"error": "At least one of query, emotion, or mood must be provided"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Print the URL we're calling for debugging
        print(f"Calling FastAPI at: {LASTFM_API_URL}/recommendations")
        print(f"Payload: {payload}")
        
        try:
            # Try to connect to FastAPI
            response = requests.post(f"{LASTFM_API_URL}/recommendations", 
                                    json=payload,
                                    timeout=5)  # Add timeout
            response.raise_for_status()
            return Response(response.json())
        except Exception as conn_error:
            print(f"Connection error: {str(conn_error)}")
            # If FastAPI is down, return actual song data instead of generic mock data
            print("FastAPI might be down, using curated song data instead")
            
            # Get emotion or mood
            emotion = payload.get("emotion", "").lower() 
            mood = payload.get("mood", "").lower()
            query = payload.get("query", "").lower()
            
            print(f"Using mood: {mood}, emotion: {emotion}, query: {query} to select songs")
            
            # Select appropriate song list based on emotion/mood
            # Map standard emotion values to song categories
            if emotion == "joy" or mood == "positive" or any(keyword in query for keyword in ["happy", "joy", "upbeat", "cheerful"]):
                song_list = HAPPY_SONGS
                message = "Happy songs for your positive mood!"
            elif emotion == "sadness" or mood == "negative" or any(keyword in query for keyword in ["sad", "down", "blue", "depressed"]):
                song_list = SAD_SONGS
                message = "Songs that understand how you feel"
            elif emotion == "neutral" and any(keyword in query for keyword in ["chill", "relax", "calm", "peaceful"]):
                song_list = CHILL_SONGS
                message = "Chill songs to help you relax"
            elif emotion == "neutral" and any(keyword in query for keyword in ["energy", "workout", "pump", "excited"]):
                song_list = ENERGETIC_SONGS
                message = "Energetic songs to boost your mood!"
            else:
                # Default to a mix of songs if emotion doesn't match 
                all_songs = HAPPY_SONGS + CHILL_SONGS + ENERGETIC_SONGS
                song_list = random.sample(all_songs, min(5, len(all_songs)))
                message = "A mix of songs just for you"
            
            # Randomly select 5 songs (or fewer if list has less than 5)
            selected_songs = random.sample(song_list, min(5, len(song_list)))
            
            print(f"Selected {len(selected_songs)} songs based on mood/emotion")
            
            return Response({
                "songs": selected_songs,
                "message": message
            })
    
    except requests.exceptions.RequestException as e:
        print(f"FastAPI service error: {str(e)}")
        return Response({"error": f"FastAPI service error: {str(e)}"}, status=status.HTTP_502_BAD_GATEWAY)
