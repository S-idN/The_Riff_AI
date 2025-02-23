from allauth.socialaccount.providers.spotify.views import SpotifyOAuth2Adapter
from dj_rest_auth.registration.views import SocialLoginView
from django.http import JsonResponse
import requests
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

class SpotifyLogin(SocialLoginView):
    adapter_class = SpotifyOAuth2Adapter

    def get_callback_url(self):
        # Redirect to your frontend after login
        return "http://localhost:8081/auth-callback"

@api_view(["POST"])
def spotify_callback(request):
    """
    Handle the Spotify OAuth2 callback and exchange the authorization code for an access token.
    """
    code = request.data.get("code")

    if not code:
        return Response(
            {"error": "Authorization code is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Exchange the code for an access token
    token_url = "https://accounts.spotify.com/api/token"
    payload = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": "http://localhost:8081/auth-callback",  # The same URI used during the Spotify OAuth2 flow
        "client_id": "738024374a41414383cec879914473f6",  # Your Spotify client ID
        "client_secret": "734582e1bcea4fceb0809bc981b3d45b",  # Your Spotify client secret
    }

    token_response = requests.post(token_url, data=payload)

    if token_response.status_code == 200:
        token_data = token_response.json()
        print("Token data:", token_data)  # Debug log
        return Response(token_data)  # Return the token data (including access_token)
    else:
        return Response(
            {"error": "Failed to exchange code for token", "details": token_response.json()},
            status=status.HTTP_400_BAD_REQUEST,
        )

@api_view(["GET"])
def spotify_profile(request):
    token = request.headers.get("Authorization")
    if not token:
        return Response({"error": "Token is missing in Authorization header"}, status=status.HTTP_400_BAD_REQUEST)
    
    # Remove 'Bearer ' prefix
    access_token = token.split(" ")[1] if token.startswith("Bearer ") else None
    if not access_token:
        return Response({"error": "Invalid token format"}, status=status.HTTP_400_BAD_REQUEST)

    # Log the token for debugging purposes
    print(f"Received access token: {access_token}")

    # Use Spotify API to fetch the user's profile
    headers = {"Authorization": f"Bearer {access_token}"}
    spotify_response = requests.get("https://api.spotify.com/v1/me", headers=headers)

    # Log the Spotify response for debugging
    print(f"Spotify API response: {spotify_response.status_code}, {spotify_response.text}")

    if spotify_response.status_code == 200:
        profile_data = spotify_response.json()
        display_name = profile_data.get("display_name", profile_data.get("id"))
        return Response({"display_name": display_name})  # Return the display_name or id if missing
    else:
        return Response(
            {"error": "Failed to fetch Spotify profile", "details": spotify_response.json()},
            status=status.HTTP_400_BAD_REQUEST,
        )

def refresh_access_token(refresh_token):
    url = "https://accounts.spotify.com/api/token"
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
    }
    data = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
        "client_id": "738024374a41414383cec879914473f6",  # Your Spotify client ID
        "client_secret": "734582e1bcea4fceb0809bc981b3d45b",  # Your Spotify client secret
    }

    response = requests.post(url, data=data, headers=headers)

    # Check if the response was successful
    if response.status_code == 200:
        return response.json()  # Return the new access token data
    else:
        print(f"Error refreshing token: {response.status_code}")
        return {"error": "Failed to refresh token", "details": response.json()}
