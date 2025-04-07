from django.urls import path
from .views import analyze_text, analyze_audio, fetch_geoip, get_song_recommendations, get_mood_recommendations

urlpatterns = [
    path("analyze_text/", analyze_text, name="analyze_text"),
    path("analyze_audio/", analyze_audio, name="analyze_audio"),
    path("fetch_geoip/", fetch_geoip, name="fetch_geoip"),
    path("song_recommendations/", get_song_recommendations, name="song_recommendations"),
    path('get_mood_recommendations/', get_mood_recommendations, name='get_mood_recommendations'),
]
