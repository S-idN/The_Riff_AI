from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import requests
import os
from typing import List
import urllib.parse

# Create router
lastfm_router = APIRouter()

# API keys
LASTFM_API_KEY = "6c237b08ecb776685d6b1dbea19210ad"  # Better to use environment variable in production

# Request and response models
class RecommendationRequest(BaseModel):
    mood: str = None
    emotion: str = None
    query: str = None

class Song(BaseModel):
    name: str
    artist: str
    url: str  # Last.fm URL
    spotify_url: str = None  # Spotify URL
    image_url: str = None

class RecommendationResponse(BaseModel):
    songs: List[Song]
    message: str = None

# Map emotions to Last.fm tags
EMOTION_TO_TAG = {
    "joy": "happy",
    "sadness": "sad",
    "anger": "angry",
    "fear": "scary",
    "disgust": "intense",
    "surprise": "upbeat",
    "neutral": "chill",
    "positive": "feel good",
    "negative": "melancholy"
}

def get_spotify_url(track_name, artist_name):
    """Generate a Spotify search URL for the track."""
    query = f"{track_name} artist:{artist_name}"
    encoded_query = urllib.parse.quote(query)
    return f"https://open.spotify.com/search/{encoded_query}"

@lastfm_router.post("/recommendations", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest):
    """
    Get song recommendations based on mood, emotion, or direct query
    """
    try:
        # Determine the search tag
        tag = None
        if request.emotion and request.emotion.lower() in EMOTION_TO_TAG:
            tag = EMOTION_TO_TAG[request.emotion.lower()]
        elif request.mood and request.mood.lower() in EMOTION_TO_TAG:
            tag = EMOTION_TO_TAG[request.mood.lower()]
        
        # Use the query directly if provided
        query = request.query or tag or "popular"
        
        # Call Last.fm API
        url = "http://ws.audioscrobbler.com/2.0/"
        params = {
            "method": "tag.gettoptracks" if tag else "track.search",
            "tag": tag if tag else None,
            "track": None if tag else query,
            "api_key": LASTFM_API_KEY,
            "format": "json",
            "limit": 10
        }
        
        response = requests.get(url, params={k: v for k, v in params.items() if v is not None})
        
        if response.status_code != 200:
            return RecommendationResponse(
                songs=[],
                message=f"Last.fm API error: {response.status_code}"
            )
        
        data = response.json()
        
        # Extract tracks based on the method used
        if tag:
            tracks = data.get("tracks", {}).get("track", [])
        else:
            tracks = data.get("results", {}).get("trackmatches", {}).get("track", [])
        
        # Format the response
        songs = []
        for track in tracks:
            image_url = None
            if "image" in track and len(track["image"]) > 0:
                # Get medium-sized image if available
                for img in track["image"]:
                    if img["size"] == "medium" and "#text" in img and img["#text"]:
                        image_url = img["#text"]
                        break
            
            artist_name = track["artist"] if isinstance(track["artist"], str) else track["artist"]["name"]
            track_name = track["name"]
            
            # Generate Spotify URL
            spotify_url = get_spotify_url(track_name, artist_name)
            
            songs.append(Song(
                name=track_name,
                artist=artist_name,
                url=track["url"],
                spotify_url=spotify_url,
                image_url=image_url
            ))
        
        return RecommendationResponse(
            songs=songs,
            message=f"Recommendations based on {'emotion' if request.emotion else 'mood' if request.mood else 'query'}: {tag or query}"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting recommendations: {str(e)}") 