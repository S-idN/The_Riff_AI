from django.urls import path , include
from dj_rest_auth.views import LoginView , LogoutView
from .views import spotify_profile, SpotifyLogin, spotify_callback, create_spotify_playlist  # Import the new view

urlpatterns = [
    path("spotify/", SpotifyLogin.as_view(), name="spotify-login"),
    path("profile/", spotify_profile, name="spotify-profile"),
    path("spotify-token/", spotify_callback, name="spotify-token"),  # Add this line for the token exchange
    path("create-playlist/", create_spotify_playlist, name="create-playlist"),  # Add this line
    path("logout/", LogoutView.as_view(), name="logout"),
]
