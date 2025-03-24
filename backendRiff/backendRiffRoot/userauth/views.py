import os
import requests
from django.http import JsonResponse
from allauth.socialaccount.providers.spotify.views import SpotifyOAuth2Adapter
from dj_rest_auth.registration.views import SocialLoginView
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import logging

# Load environment variables
SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")

# Define multiple redirect URIs for different platforms
SPOTIFY_REDIRECT_URIS = {
    "web": "http://localhost:8081/auth-callback",
    "pc": "http://localhost:8000/auth/complete/spotify/",
    "mobile": "myapp://auth-callback",
    "android_studio": "http://10.0.2.2:8081/auth-callback"
}

SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
SPOTIFY_PROFILE_URL = "https://api.spotify.com/v1/me"

logger = logging.getLogger(__name__)

class SpotifyLogin(SocialLoginView):
    adapter_class = SpotifyOAuth2Adapter

    def get_callback_url(self):
        return SPOTIFY_REDIRECT_URIS.get("web")  # Default to web


def get_redirect_uri(platform):
    """ Returns the correct redirect URI based on the platform. """
    return SPOTIFY_REDIRECT_URIS.get(platform, SPOTIFY_REDIRECT_URIS["web"])


def geoip_view(request):
    ip = request.GET.get("ip")
    
    if not ip:
        logger.error("GeoIP request missing IP parameter")
        return JsonResponse({"error": "IP address is required"}, status=400)

    geoip_url = f"https://ipapi.co/{ip}/json/"
    
    try:
        response = requests.get(geoip_url, timeout=5)  # Added timeout for reliability
        
        if response.status_code != 200:
            logger.error(f"GeoIP API request failed with status {response.status_code}")
            return JsonResponse({"error": "Failed to fetch geoip data"}, status=500)

        return JsonResponse(response.json())

    except requests.exceptions.RequestException as e:
        logger.exception(f"GeoIP API request error: {e}")
        return JsonResponse({"error": "GeoIP service unavailable"}, status=500)


@api_view(["POST"])
def spotify_callback(request):
    code = request.data.get("code")
    platform = request.data.get("platform", "web")  # Default to web

    if not code:
        logger.error("Missing authorization code")
        return Response({"error": "Authorization code is required"}, status=status.HTTP_400_BAD_REQUEST)

    redirect_uri = get_redirect_uri(platform)

    # Debug logging
    logger.info(f"Received authorization code for platform: {platform}")
    logger.info(f"Using redirect URI: {redirect_uri}")
    logger.info(f"Client ID: {SPOTIFY_CLIENT_ID}")
    logger.info(f"Client Secret present: {'Yes' if SPOTIFY_CLIENT_SECRET else 'No'}")

    # Exchange authorization code for an access token
    payload = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": redirect_uri,
        "client_id": SPOTIFY_CLIENT_ID,
        "client_secret": SPOTIFY_CLIENT_SECRET,
    }

    logger.info(f"Sending token request with payload: {payload}")

    response = requests.post(SPOTIFY_TOKEN_URL, data=payload)
    
    logger.info(f"Spotify token response status: {response.status_code}")
    
    try:
        token_data = response.json()
        if response.status_code == 200:
            logger.info("Successfully obtained access token")
            return Response(token_data)
        else:
            logger.error(f"Token exchange failed: {token_data}")
            return Response({"error": "Failed to exchange token", "details": token_data}, status=response.status_code)
    except requests.exceptions.JSONDecodeError:
        logger.error("Invalid response from Spotify")
        return Response({"error": "Invalid response from Spotify"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
def spotify_profile(request):
    token = request.headers.get("Authorization")
    if not token:
        return Response({"error": "Token is missing in Authorization header"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Extract Bearer token
    access_token = token.split(" ")[1] if token.startswith("Bearer ") else None
    if not access_token:
        return Response({"error": "Invalid token format"}, status=status.HTTP_400_BAD_REQUEST)

    # Use Spotify API to fetch the user's profile
    headers = {"Authorization": f"Bearer {access_token}"}
    spotify_response = requests.get(SPOTIFY_PROFILE_URL, headers=headers)

    if spotify_response.status_code == 200:
        profile_data = spotify_response.json()
        display_name = profile_data.get("display_name") or profile_data.get("id")  # Fallback to user ID
        return Response({"display_name": display_name})
    elif spotify_response.status_code == 403:
        return Response({"error": "Access denied. Check Spotify developer settings."}, status=status.HTTP_403_FORBIDDEN)
    else:
        return Response(
            {"error": "Failed to fetch Spotify profile", "details": spotify_response.json()},
            status=spotify_response.status_code,
        )


def refresh_access_token(refresh_token):
    """
    Refresh the Spotify access token.
    """
    payload = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
        "client_id": SPOTIFY_CLIENT_ID,
        "client_secret": SPOTIFY_CLIENT_SECRET,
    }

    response = requests.post(SPOTIFY_TOKEN_URL, data=payload, headers={"Content-Type": "application/x-www-form-urlencoded"})

    try:
        if response.status_code == 200:
            return response.json()
        else:
            return {"error": "Failed to refresh token", "details": response.json()}

    except requests.exceptions.JSONDecodeError:
        return {"error": "Invalid response from Spotify"}


@api_view(["POST"])
def create_spotify_playlist(request):
    """Create a new playlist in the user's Spotify account and add songs to it"""
    token = request.headers.get("Authorization")
    if not token:
        return Response({"error": "Token is missing in Authorization header"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Extract Bearer token
    access_token = token.split(" ")[1] if token.startswith("Bearer ") else None
    if not access_token:
        return Response({"error": "Invalid token format"}, status=status.HTTP_400_BAD_REQUEST)

    # Get user's Spotify ID
    headers = {"Authorization": f"Bearer {access_token}"}
    profile_response = requests.get(SPOTIFY_PROFILE_URL, headers=headers)
    
    if profile_response.status_code != 200:
        logger.error(f"Failed to fetch user profile: {profile_response.text}")
        return Response({"error": "Failed to fetch user profile"}, status=profile_response.status_code)
    
    user_id = profile_response.json().get("id")
    if not user_id:
        return Response({"error": "Could not get user ID"}, status=status.HTTP_400_BAD_REQUEST)

    # Create playlist
    playlist_data = request.data
    playlist_name = playlist_data.get("name", "New Playlist")
    playlist_description = playlist_data.get("description", "Created by Riff AI")
    is_public = playlist_data.get("public", True)
    songs = playlist_data.get("songs", [])  # Get songs from request data

    create_playlist_url = f"https://api.spotify.com/v1/users/{user_id}/playlists"
    playlist_payload = {
        "name": playlist_name,
        "description": playlist_description,
        "public": is_public
    }

    create_response = requests.post(
        create_playlist_url,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        },
        json=playlist_payload
    )

    if create_response.status_code != 201:
        logger.error(f"Failed to create playlist: {create_response.text}")
        return Response(
            {"error": "Failed to create playlist", "details": create_response.json()},
            status=create_response.status_code
        )

    playlist_id = create_response.json().get("id")
    if not playlist_id:
        return Response({"error": "Could not get playlist ID"}, status=status.HTTP_400_BAD_REQUEST)

    # Add songs to the playlist
    if songs:
        # Search for each song on Spotify and get its URI
        track_uris = []
        for song in songs:
            try:
                search_url = "https://api.spotify.com/v1/search"
                search_params = {
                    "q": f"track:{song['name']} artist:{song['artist']}",
                    "type": "track",
                    "limit": 1
                }
                search_response = requests.get(
                    search_url,
                    headers={"Authorization": f"Bearer {access_token}"},
                    params=search_params
                )
                
                if search_response.status_code == 200:
                    search_data = search_response.json()
                    if search_data.get("tracks", {}).get("items"):
                        track_uri = search_data["tracks"]["items"][0]["uri"]
                        track_uris.append(track_uri)
                        logger.info(f"Found track URI for {song['name']}: {track_uri}")
                    else:
                        logger.warning(f"No track found for {song['name']} by {song['artist']}")
                else:
                    logger.error(f"Failed to search for track {song['name']}: {search_response.text}")
            except Exception as e:
                logger.error(f"Error searching for track {song['name']}: {str(e)}")

        # Add tracks to playlist in batches of 100 (Spotify's limit)
        if track_uris:
            add_tracks_url = f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks"
            for i in range(0, len(track_uris), 100):
                batch = track_uris[i:i + 100]
                try:
                    add_response = requests.post(
                        add_tracks_url,
                        headers={
                            "Authorization": f"Bearer {access_token}",
                            "Content-Type": "application/json"
                        },
                        json={"uris": batch}
                    )
                    
                    if add_response.status_code != 201:
                        logger.error(f"Failed to add tracks batch: {add_response.text}")
                        return Response(
                            {"error": "Failed to add tracks to playlist", "details": add_response.json()},
                            status=add_response.status_code
                        )
                    logger.info(f"Successfully added batch of {len(batch)} tracks")
                except Exception as e:
                    logger.error(f"Error adding tracks batch: {str(e)}")
                    return Response(
                        {"error": "Failed to add tracks to playlist", "details": str(e)},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )

    return Response(create_response.json())
