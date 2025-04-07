from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
import requests
import os
import random
import logging 
import json

# URLs for FastAPI services - get from settings
from django.conf import settings

logger = logging.getLogger(__name__)

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


# --- MAPPINGS (Needed for Tag lookup) ---
EMOTION_GENRE_MAPPING = {
    'joy': ['happy', 'pop', 'dance', 'upbeat'],
    'sadness': ['sad', 'acoustic', 'indie', 'ambient', 'melancholic'],
    'anger': ['rock', 'metal', 'punk', 'hard rock'],
    'fear': ['ambient', 'classical', 'instrumental', 'dark ambient'],
    'surprise': ['electronic', 'experimental', 'jazz', 'idm'],
    'disgust': ['industrial', 'noise', 'experimental', 'punk'],
    'neutral': ['pop', 'rock', 'alternative', 'chill', 'indie pop']
}

MOOD_MODIFIER = {
    'positive': ['upbeat', 'energetic', 'happy', 'summer'],
    'negative': ['melancholic', 'dark', 'sad', 'rainy day'],
    'neutral': ['moderate', 'chill', 'alternative', 'study']
}
# Location mapping not used in this version

# --- Last.fm API Helper Function (Keep this) ---
LOCATION_TAG_MAPPING = {
    'in': ['indian pop', 'bollywood', 'malayalam', 'tamil', 'hindi', 'indipop', 'indian classical', 'indian folk', 'sufi', 'ghazal', 'bhangra'], # Expanded India example
    # Add MANY MORE countries and relevant tags!
    'us': ['country', 'hip hop', 'blues', 'americana', 'soul', 'rock', 'pop', 'r&b', 'folk'],
    # ... etc ...
}

def call_lastfm(method, params, api_key, base_url='http://ws.audioscrobbler.com/2.0/'):
    # ... (Corrected function from previous step) ...
    base_params = { 'api_key': api_key, 'format': 'json', 'method': method }
    all_params = {**base_params, **params}
    response = None
    try:
        response = requests.get(base_url, params=all_params, timeout=10)
        response.raise_for_status()
        data = response.json()
        if 'error' in data: logger.error(f"LFM Error: {data.get('message')} ({method})"); return None
        return data
    except requests.exceptions.Timeout:
        logger.warning(f"LFM timeout: {method} {params}") # Log params too
        return None

    except requests.exceptions.RequestException as e:
        status_code = e.response.status_code if e.response is not None else 'N/A'
        logger.error(f"LFM request error: {method} ({status_code}): {e}")
        # Safely log response body if it exists
        if e.response is not None:
            try:
                body_snippet = e.response.text[:200] if e.response.text else "(Empty Body)"
            except Exception:
                body_snippet = "(Error reading response body)"
            logger.error(f"LFM Body: {body_snippet}")
        return None

    except ValueError:
        snippet = "(No response object)"
        # Check the response variable captured before the try block ended
        if response is not None:
            try:
                snippet = response.text[:200] if response.text else "(Empty Body)"
            except Exception:
                snippet = "(Error reading response text)"
        logger.error(f"LFM JSON decode error: {method}. Snippet: {snippet}")
        return None

    except Exception as e:
        logger.exception(f"LFM unexpected error: {method}") # Includes traceback
        return None


@api_view(['POST'])
def get_mood_recommendations(request):
    """
    Get recommendations blending Location & Mood artists using a weighted score.
    Fetches top track per artist.
    """
    try:
        emotion = request.data.get('emotion', '').lower()
        mood = request.data.get('mood', '').lower()
        country = request.data.get('country', '')
        country_code = request.data.get('country_code', '').lower()

        logger.info(f"Request: emotion='{emotion}', mood='{mood}', country='{country}'")
        if not emotion or not mood: return Response({'error': 'Emotion and mood required'}, status=status.HTTP_400_BAD_REQUEST)

        # --- Determine Tags to Query ---
        location_tags_to_query = []
        using_location_tags = False
        if country_code:
            possible_location_tags = LOCATION_TAG_MAPPING.get(country_code, [])
            if possible_location_tags:
                 num_loc_tags = min(len(possible_location_tags), 3)
                 location_tags_to_query = random.sample(possible_location_tags, num_loc_tags)
                 logger.info(f"Selected location tags: {location_tags_to_query}")
                 using_location_tags = True
            else: logger.warning(f"No location tags defined for '{country_code}'.")
        else: logger.info("No country_code provided - relying on mood tags.")

        emotion_tags = EMOTION_GENRE_MAPPING.get(emotion, [])
        mood_tags = MOOD_MODIFIER.get(mood, [])
        mood_emotion_tags = list(set(emotion_tags + mood_tags))
        if not mood_emotion_tags: mood_emotion_tags = ['pop']
        num_mood_tags = min(len(mood_emotion_tags), 3) # Use up to 3 mood tags
        mood_tags_to_query = random.sample(mood_emotion_tags, num_mood_tags)
        logger.info(f"Selected mood/emotion tags: {mood_tags_to_query}")


        # --- Fetch Artists Concurrently (Location and Mood Tags Separately) ---
        api_key = os.getenv('LASTFM_API_KEY', 'YOUR_LASTFM_API_KEY')
        if api_key == 'YOUR_LASTFM_API_KEY': return Response({'error': 'Server config error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        top_geo_artists = set()
        top_mood_artists = set()
        MAX_ARTISTS_PER_TAG = 100 # Fetch a large pool for each tag

        tags_to_fetch_geo = location_tags_to_query # Use selected location tags
        tags_to_fetch_mood = mood_tags_to_query # Use selected mood tags

        num_workers = len(tags_to_fetch_geo) + len(tags_to_fetch_mood)
        if num_workers == 0: return Response({'error': 'No tags to query'}, status=status.HTTP_400_BAD_REQUEST)

        logger.info(f"Fetching artists for {len(tags_to_fetch_geo)} location tags and {len(tags_to_fetch_mood)} mood tags...")
        with ThreadPoolExecutor(max_workers=max(num_workers, 2)) as executor:
            futures = {}
            for tag in tags_to_fetch_geo:
                 futures[executor.submit(call_lastfm, 'tag.getTopArtists', {'tag': tag, 'limit': MAX_ARTISTS_PER_TAG}, api_key)] = 'geo'
            for tag in tags_to_fetch_mood:
                 futures[executor.submit(call_lastfm, 'tag.getTopArtists', {'tag': tag, 'limit': MAX_ARTISTS_PER_TAG}, api_key)] = 'mood'

            for future in as_completed(futures):
                category = futures[future]
                result = future.result()
                if result:
                    topartists_data = result.get('topartists')
                    if isinstance(topartists_data, dict):
                        artists = topartists_data.get('artist', [])
                        artist_names = set(a.get('name') for a in artists if a.get('name'))
                        if category == 'geo': top_geo_artists.update(artist_names)
                        elif category == 'mood': top_mood_artists.update(artist_names)
                    # ... log warnings ...
                # ... log warnings ...

        logger.info(f"Found {len(top_geo_artists)} unique geo artists and {len(top_mood_artists)} unique mood artists.")

        # --- Score and Select Candidate Artists ---
        artist_scores = defaultdict(int)
        geo_weight = 2 # Higher weight for being found via location tag
        mood_weight = 1 # Lower weight for being found via mood tag

        for artist in top_geo_artists:
            artist_scores[artist] += geo_weight
        for artist in top_mood_artists:
            artist_scores[artist] += mood_weight

        # Sort artists by score (descending), then shuffle within scores for variety
        sorted_artists = sorted(artist_scores.items(), key=lambda item: item[1], reverse=True)

        # Group artists by score
        grouped_artists = defaultdict(list)
        for artist, score in sorted_artists:
             grouped_artists[score].append(artist)

        # Create final candidate list by taking from highest score groups first, shuffling within groups
        candidate_artists_list = []
        for score in sorted(grouped_artists.keys(), reverse=True):
             group = grouped_artists[score]
             random.shuffle(group)
             candidate_artists_list.extend(group)

        logger.info(f"Total unique artists considered: {len(candidate_artists_list)}. Top scored sample: {candidate_artists_list[:10]}")

        if not candidate_artists_list:
             logger.warning("No candidate artists found after scoring.")
             return Response({'songs': [], 'message': 'Could not find relevant artists.'})

        # --- Fetch Top Track (Limit=1) for Candidates ---
        songs = []
        seen_artists = set()
        MAX_SONGS_TO_RETURN = 10
        artists_to_query = candidate_artists_list[:MAX_SONGS_TO_RETURN * 5] # Query buffer

        logger.info(f"Fetching top track for up to {len(artists_to_query)} artists based on score...")
        with ThreadPoolExecutor(max_workers=10) as executor:
            # ... (submit tasks for artist.getTopTracks, limit=1) ...
            future_to_artist = { executor.submit(call_lastfm, 'artist.getTopTracks', {'artist': artist, 'limit': 1, 'autocorrect': 1}, api_key): artist for artist in artists_to_query }
            processed_artists_count = 0
            for future in as_completed(future_to_artist):
                 # ... (process results, check limit, handle errors) ...
                  if len(songs) >= MAX_SONGS_TO_RETURN:
                     for f in future_to_artist: f.cancel(); break
                  artist_name_submitted = future_to_artist[future]; processed_artists_count += 1
                  try: track_data = future.result()
                  except Exception as e: logger.error(f"Err getting track for '{artist_name_submitted}': {e}"); continue
                  if not track_data or not track_data.get('toptracks'): continue
                  corrected_artist_name = track_data['toptracks'].get('@attr', {}).get('artist', artist_name_submitted)
                  if corrected_artist_name in seen_artists: continue # UNIQUE ARTIST constraint
                  tracks = track_data.get('toptracks', {}).get('track', [])
                  if tracks:
                      track = tracks[0]; track_name = track.get('name')
                      if track_name and corrected_artist_name:
                           if corrected_artist_name in seen_artists: continue # Double check
                           # Basic word filter
                           problematic_words = ['vagina', 'nigger', 'faggot', 'cunt', 'explicit', 'sex', 'fuck'];
                           if any(word in track_name.lower() for word in problematic_words): logger.warning(f"Skipping track '{track_name}' (filter)"); continue
                           # Create song dict and add
                           spotify_query = f"{track_name} {corrected_artist_name}".replace(" ", "+"); spotify_url = f"https://open.spotify.com/search/{spotify_query}"
                           image_list = track.get('image', [{}]); image_url = image_list[-1].get('#text') if image_list else None
                           song = { 'name': track_name, 'artist': corrected_artist_name, 'spotify_url': spotify_url, 'lastfm_url': track.get('url'), 'image_url': image_url }
                           songs.append(song)
                           seen_artists.add(corrected_artist_name)
                           logger.debug(f"Added: '{track_name}' by '{corrected_artist_name}' ({len(songs)}/{MAX_SONGS_TO_RETURN}).")


        logger.info(f"Finished processing {processed_artists_count} artists. Collected {len(songs)} songs.")
        songs = songs[:MAX_SONGS_TO_RETURN]
        # No final shuffle needed if we processed artists by score order

        return Response({'songs': songs})

    except Exception as e:
        logger.exception("Unexpected error in get_mood_recommendations")
        return Response({'error': 'Failed to get recommendations (internal error)'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)