# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from services.geoip_service import geoip_router
from services.userinput_service import input_router
from services.lastfm_service import lastfm_router
from services.musicbrainz_service import musicbrainz_router
"""from services.ai_model_service import ai_model_router"""

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Registering the routers
app.include_router(geoip_router, prefix="/geoip", tags=["GeoIP"])
app.include_router(input_router, prefix="/user_input", tags=["User Input"])
app.include_router(lastfm_router, prefix="/lastfm", tags=["Last.fm"])
app.include_router(musicbrainz_router, prefix="/musicbrainz", tags=["MusicBrainz"])
"""app.include_router(ai_model_router, prefix="/ai_model", tags=["AI Model"])"""

@app.get("/")
async def root():
    return {"message": "Welcome to the playlist generator API!"}
