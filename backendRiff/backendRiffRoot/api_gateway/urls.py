from django.urls import path
from .views import analyze_text, analyze_audio, fetch_geoip,get_song_recommendation

urlpatterns = [
    path("get_song_recommendation/", get_song_recommendation, name="get_song_recommendation"),
    path("analyze_text/", analyze_text, name="analyze_text"),
    path("analyze_audio/", analyze_audio, name="analyze_audio"),
    path("fetch_geoip/", fetch_geoip, name="fetch_geoip"),
]