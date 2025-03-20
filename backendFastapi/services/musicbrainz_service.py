from fastapi import APIRouter, HTTPException
import requests
import time
from typing import Optional

musicbrainz_router = APIRouter()

# MusicBrainz API base URL
MUSICBRAINZ_API_URL = "https://musicbrainz.org/ws/2"

def get_release_cover(release_id: str) -> Optional[str]:
    """
    Get cover art for a release using MusicBrainz API.
    Returns the cover art URL if found, None otherwise.
    """
    try:
        # First, get the release information
        headers = {
            "User-Agent": "RiffAI/1.0 (siddharth2004nair@gmail.com)",  # Replace with your email
            "Accept": "application/json"
        }
        
        # Add delay to respect rate limiting
        time.sleep(1)
        
        # Get release information
        release_url = f"{MUSICBRAINZ_API_URL}/release/{release_id}"
        release_response = requests.get(release_url, headers=headers)
        release_response.raise_for_status()
        release_data = release_response.json()
        
        # Get cover art
        cover_url = f"https://coverartarchive.org/release/{release_id}/front"
        cover_response = requests.head(cover_url)
        
        if cover_response.status_code == 200:
            return cover_url
        return None
        
    except requests.exceptions.RequestException as e:
        print(f"Error fetching cover art: {str(e)}")
        return None

def search_release(artist: str, title: str) -> Optional[str]:
    """
    Search for a release by artist and title.
    Returns the release ID if found, None otherwise.
    """
    try:
        headers = {
            "User-Agent": "RiffAI/1.0 (your-email@example.com)",  # Replace with your email
            "Accept": "application/json"
        }
        
        # Add delay to respect rate limiting
        time.sleep(1)
        
        # Search for the release
        search_url = f"{MUSICBRAINZ_API_URL}/release"
        params = {
            "query": f'release:"{title}" AND artist:"{artist}"',
            "limit": 1
        }
        
        response = requests.get(search_url, headers=headers, params=params)
        response.raise_for_status()
        data = response.json()
        
        if data.get("releases"):
            return data["releases"][0]["id"]
        return None
        
    except requests.exceptions.RequestException as e:
        print(f"Error searching release: {str(e)}")
        return None

@musicbrainz_router.get("/cover")
async def get_song_cover(artist: str, title: str):
    """
    Get cover art for a song by artist and title.
    """
    try:
        # Search for the release
        release_id = search_release(artist, title)
        if not release_id:
            return {"error": "No release found"}
            
        # Get cover art
        cover_url = get_release_cover(release_id)
        if not cover_url:
            return {"error": "No cover art found"}
            
        return {"cover_url": cover_url}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 