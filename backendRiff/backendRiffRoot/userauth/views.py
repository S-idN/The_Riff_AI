import os
import requests
from django.http import JsonResponse
from allauth.socialaccount.providers.spotify.views import SpotifyOAuth2Adapter
from dj_rest_auth.registration.views import SocialLoginView
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

# Load environment variables
SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
SPOTIFY_REDIRECT_URI = os.getenv("SPOTIFY_REDIRECT_URI", "http://localhost:8081/auth-callback")

SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
SPOTIFY_PROFILE_URL = "https://api.spotify.com/v1/me"


class SpotifyLogin(SocialLoginView):
    adapter_class = SpotifyOAuth2Adapter

    def get_callback_url(self):
        return SPOTIFY_REDIRECT_URI


@api_view(["POST"])
def spotify_callback(request):
    """
    Handle Spotify OAuth2 callback and exchange the authorization code for an access token.
    """
    code = request.data.get("code")

    if not code:
        return Response({"error": "Authorization code is required"}, status=status.HTTP_400_BAD_REQUEST)

    # Exchange authorization code for an access token
    payload = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": SPOTIFY_REDIRECT_URI,
        "client_id": SPOTIFY_CLIENT_ID,
        "client_secret": SPOTIFY_CLIENT_SECRET,
    }

    response = requests.post(SPOTIFY_TOKEN_URL, data=payload)

    try:
        token_data = response.json()
        if response.status_code == 200:
            return Response(token_data)  # Successfully authenticated
        else:
            return Response({"error": "Failed to exchange token", "details": token_data}, status=response.status_code)

    except requests.exceptions.JSONDecodeError:
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
