from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
import requests
import os
import random
import json

# URLs for FastAPI services - get from settings
from django.conf import settings

# Get URLs from settings
USER_INPUT_API_URL = settings.USER_INPUT_API_URL
GEOIP_API_URL = settings.GEOIP_API_URL
LASTFM_API_URL = settings.LASTFM_API_URL

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
            # If FastAPI is down, use our improved mock analysis function
            print("FastAPI might be down, using improved mock analysis instead")
            
            # Instead of passing the request object, extract the needed data
            # and create a new mock request by manually analyzing the text
            # Analyze the text directly using the same logic as in mock_analyze_text
            
            # Create a mock result using the text
            return perform_mock_analysis(text)
    
    except requests.exceptions.RequestException as e:
        print(f"FastAPI service error: {str(e)}")
        return Response({"error": f"FastAPI service error: {str(e)}"}, status=status.HTTP_502_BAD_GATEWAY)


def perform_mock_analysis(text):
    """Helper function with the same logic as mock_analyze_text but accepts text directly."""
    if not text.strip():
        return Response({"error": "Text input is required"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Expanded keyword lists for better emotion detection
    positive_keywords = [
        "happy", "good", "great", "joy", "love", "excited", "cheerful", 
        "amazing", "wonderful", "fantastic", "awesome", "delighted", "pleased",
        "thrilled", "content", "satisfied", "enjoy", "fun", "laugh", "smile",
        "grateful", "thankful", "blessed", "hopeful", "optimistic"
    ]
    
    negative_keywords = [
        "sad", "bad", "hate", "angry", "upset", "depressed", "tired",
        "awful", "terrible", "horrible", "unhappy", "disappointed", "miserable",
        "frustrated", "annoyed", "stress", "stressed", "worried", "anxious",
        "fear", "scared", "lonely", "alone", "hurt", "pain", "grief"
    ]
    
    calm_keywords = [
        "calm", "relaxed", "chill", "peaceful", "quiet", "zen",
        "serene", "tranquil", "gentle", "soothing", "mellow", "easy",
        "harmony", "meditate", "meditation", "breathe", "rest", "relax"
    ]
    
    energetic_keywords = [
        "energy", "workout", "dance", "pumped", "power", "run",
        "active", "lively", "dynamic", "vibrant", "intense", "strong",
        "motivated", "drive", "passion", "fire", "excitement", "thrill"
    ]
    
    # Count matches in each category for more nuanced analysis
    positive_count = sum(1 for word in positive_keywords if word in text.lower())
    negative_count = sum(1 for word in negative_keywords if word in text.lower())
    calm_count = sum(1 for word in calm_keywords if word in text.lower())
    energetic_count = sum(1 for word in energetic_keywords if word in text.lower())
    
    # More specific emotion detection
    if "love" in text.lower() or "loving" in text.lower():
        specific_emotion = "love"
    elif "angry" in text.lower() or "anger" in text.lower() or "mad" in text.lower():
        specific_emotion = "anger"
    elif "afraid" in text.lower() or "scared" in text.lower() or "fear" in text.lower():
        specific_emotion = "fear"
    elif "surprise" in text.lower() or "surprised" in text.lower() or "shocking" in text.lower():
        specific_emotion = "surprise"
    elif "disgust" in text.lower() or "disgusted" in text.lower() or "gross" in text.lower():
        specific_emotion = "disgust"
    elif negative_count > 0 and any(word in text.lower() for word in ["sad", "unhappy", "depression", "depressed", "cry", "tears"]):
        specific_emotion = "sadness"
    elif positive_count > 0 and any(word in text.lower() for word in ["happy", "joy", "delighted", "pleased", "glad"]):
        specific_emotion = "joy"
    elif calm_count > energetic_count and calm_count > 0:
        specific_emotion = "calm"
    elif energetic_count > calm_count and energetic_count > 0:
        specific_emotion = "energetic"
    else:
        # Default emotion based on the highest count
        counts = [
            (positive_count, "joy"),
            (negative_count, "sadness"),
            (calm_count, "calm"),
            (energetic_count, "energetic")
        ]
        _, specific_emotion = max(counts, key=lambda x: x[0]) if any(c > 0 for c, _ in counts) else (0, "neutral")
    
    # Determine mood (broader category)
    if positive_count > negative_count:
        mood = "positive"
    elif negative_count > positive_count:
        mood = "negative"
    elif calm_count > energetic_count:
        mood = "neutral" # Using neutral for calm
    elif energetic_count > calm_count:
        mood = "positive" # Using positive for energetic
    else:
        mood = "neutral"
    
    # Map specific emotions to the expected emotion values
    emotion_mapping = {
        "joy": "joy",
        "sadness": "sadness",
        "anger": "anger",
        "fear": "fear",
        "surprise": "surprise",
        "disgust": "disgust",
        "calm": "neutral", # Map calm to neutral for compatibility
        "energetic": "joy", # Map energetic to joy for compatibility
        "love": "joy"      # Map love to joy for compatibility
    }
    
    emotion = emotion_mapping.get(specific_emotion, "neutral")
    
    # Create mock embedding - smaller size to save bandwidth
    embedding = [0.0] * 10  # Simplified embedding
    
    print(f"Mock analysis results - Mood: {mood}, Emotion: {emotion}, Specific: {specific_emotion}")
    print(f"Keyword matches - Positive: {positive_count}, Negative: {negative_count}, Calm: {calm_count}, Energetic: {energetic_count}")
    
    return Response({
        "mood": mood,
        "emotion": emotion,
        "specific_emotion": specific_emotion,  # Additional field for more detailed frontend display
        "intent_context_embedding": embedding
    })


@api_view(["POST"])
def analyze_audio(request):
    """Forward audio/video file to FastAPI user input service."""
    try:
        if "file" not in request.FILES:
            return Response({"error": "Audio/video file is required"}, status=status.HTTP_400_BAD_REQUEST)

        file = request.FILES["file"]
        
        # List of supported media types
        supported_types = [
            'audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/mp4',
            'video/mp4', 'video/webm', 'video/quicktime'
        ]
        
        if file.content_type not in supported_types:
            return Response({
                "error": f"Unsupported file type. Supported types: {', '.join(supported_types)}"
            }, status=status.HTTP_400_BAD_REQUEST)

        files = {"file": (file.name, file, file.content_type)}
        
        print(f"Sending file to FastAPI: {file.name} ({file.content_type})")
        
        response = requests.post(
            f"{USER_INPUT_API_URL}/analyze_audio",
            files=files,
            timeout=30  # Increased timeout for larger files
        )
        
        if not response.ok:
            print(f"FastAPI error response: {response.content}")
            return Response({
                "error": "Failed to analyze audio/video content",
                "details": response.content.decode() if response.content else None
            }, status=response.status_code)
            
        return Response(response.json())

    except requests.exceptions.RequestException as e:
        print(f"Error in analyze_audio: {str(e)}")
        return Response({
            "error": "Failed to process audio/video",
            "details": str(e)
        }, status=status.HTTP_502_BAD_GATEWAY)


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


@api_view(['POST'])
def get_song_recommendations(request):
    """Get song recommendations based on emotion and mood"""
    # Extract mood and emotion from the request data
    mood = request.data.get('mood')
    emotion = request.data.get('emotion')

    if not mood or not emotion:
        return Response({'error': 'Mood and emotion are required.'}, status=400)

    # Last.fm API key from environment variables
    LASTFM_API_KEY = os.getenv('LASTFM_API_KEY')

    # Fetch song recommendations from Last.fm based on the mood and emotion
    try:
        # Create a search query that combines mood and emotion
        search_query = f"{mood} {emotion}"  # Combine mood and emotion for better results

        # Use the Last.fm API to search for tracks with the specified tags
        response = requests.get(
            f'https://ws.audioscrobbler.com/2.0/',
            params={
                'method': 'tag.getTopTracks',
                'tag': mood,  # Use mood as the tag for searching
                'api_key': LASTFM_API_KEY,
                'format': 'json',
                'limit': 10  # Limit the number of results
            }
        )

        if response.status_code != 200:
            return Response({'error': 'Failed to fetch recommendations from Last.fm.'}, status=response.status_code)

        data = response.json()

        # Check if the response contains track matches
        if 'tracks' in data and 'track' in data['tracks']:
            tracks = data['tracks']['track']
            recommendations = [
                {
                    'name': track['name'],
                    'artist': track['artist']['name'],
                    'url': track['url'],
                    'image_url': track['image'][2]['#text'] if track['image'] else None,  # Get medium-sized image
                }
                for track in tracks
            ]
            return Response({'songs': recommendations})

        # Check if the response contains similar track matches
        if 'similartracks' in data and 'track' in data['similartracks']:
            similar_tracks = data['similartracks']['track']
            recommendations = []
            
            for similar_track in similar_tracks:
                track_name = similar_track['name']
                artist_name = similar_track['artist']['name']
                
                # Create Spotify search URL
                spotify_query = f"{track_name} {artist_name}".replace(" ", "+")
                spotify_url = f"https://open.spotify.com/search/{spotify_query}"
                
                recommendations.append({
                    'name': track_name,
                    'artist': artist_name,
                    'url': similar_track['url'],
                    'image_url': similar_track['image'][2]['#text'] if similar_track['image'] else None,
                    'spotify_url': spotify_url
                })
            
            return Response({'songs': recommendations})

        return Response({'message': 'No songs found matching your mood and emotion.'}, status=404)

    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(["POST"])
def mock_analyze_text(request):
    """A mock endpoint that doesn't rely on FastAPI."""
    text = request.data.get("text", "").strip()
    return perform_mock_analysis(text)

api_key = os.getenv('LASTFM_API_KEY')
print(f"Last.fm API Key: {api_key}")  # Log the API key for debugging

@api_view(['POST'])
def get_mood_recommendations(request):
    """Get song recommendations based on emotion and mood."""
    try:
        emotion = request.data.get('emotion', '').lower()
        mood = request.data.get('mood', '').lower()

        if not emotion or not mood:
            return Response(
                {'error': 'Both emotion and mood are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Map emotions to genres
        EMOTION_GENRE_MAPPING = {
            'joy': ['happy', 'pop', 'dance'],
            'sadness': ['sad', 'acoustic', 'indie'],
            'anger': ['rock', 'metal', 'punk'],
            'fear': ['ambient', 'classical', 'instrumental'],
            'surprise': ['electronic', 'experimental', 'jazz'],
            'disgust': ['industrial', 'noise', 'experimental'],
            'neutral': ['pop', 'rock', 'alternative']
        }

        # Map moods to modifiers
        MOOD_MODIFIER = {
            'positive': ['upbeat', 'energetic', 'happy'],
            'negative': ['melancholic', 'dark', 'sad'],
            'neutral': ['moderate', 'chill', 'alternative']
        }

        # Get genre tags based on emotion
        genres = EMOTION_GENRE_MAPPING.get(emotion, ['pop'])
        mood_modifiers = MOOD_MODIFIER.get(mood, ['moderate'])

        # Combine genres and mood modifiers for better recommendations
        tags = genres + mood_modifiers
        
        # LastFM API parameters
        api_key = os.getenv('LASTFM_API_KEY', '6c237b08ecb776685d6b1dbea19210ad')
        base_url = 'http://ws.audioscrobbler.com/2.0/'
        
        # Get recommendations from LastFM
        songs = []
        for tag in tags[:2]:  # Limit to first 2 tags for faster response
            params = {
                'method': 'tag.gettoptracks',
                'tag': tag,
                'api_key': api_key,
                'format': 'json',
                'limit': 5
            }
            
            print(f"Fetching LastFM recommendations for tag: {tag}")
            response = requests.get(base_url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                tracks = data.get('tracks', {}).get('track', [])
                
                for track in tracks:
                    # Create Spotify search URL
                    track_name = track.get('name', '')
                    artist_name = track.get('artist', {}).get('name', '')
                    spotify_query = f"{track_name} {artist_name}".replace(" ", "+")
                    spotify_url = f"https://open.spotify.com/search/{spotify_query}"
                    
                    song = {
                        'name': track_name,
                        'artist': artist_name,
                        'spotify_url': spotify_url,
                        'lastfm_url': track.get('url'),
                        'image_url': track.get('image', [{}])[-1].get('#text')  # Get largest image
                    }
                    if song not in songs:
                        songs.append(song)
            else:
                print(f"LastFM API error: {response.status_code} - {response.text}")

        # Shuffle and limit results
        random.shuffle(songs)
        songs = songs[:10]  # Limit to 10 songs

        return Response({'songs': songs})

    except Exception as e:
        print(f"Error in get_mood_recommendations: {str(e)}")
        return Response(
            {'error': 'Failed to get recommendations'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
