# geoip_service/main.py
from fastapi import APIRouter, HTTPException, Query
import requests
from datetime import datetime, timedelta, timezone

geoip_router = APIRouter()

IPWHO_URL = "https://ipwho.is/"
OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"


def get_time_of_day(offset_seconds: int) -> int:
    utc_time = datetime.now(timezone.utc)
    local_time = utc_time + timedelta(seconds=offset_seconds)
    hour = local_time.hour
    if 0 <= hour < 6:
        return 0  # Early Morning
    elif 6 <= hour < 12:
        return 1  # Morning
    elif 12 <= hour < 18:
        return 2  # Afternoon
    else:
        return 3  # Evening/Night


@geoip_router.get("/")
def get_geoip_data(ip: str = Query(..., description="User IP address")):
    # Fetch location & timezone info from ipwho.is
    ip_response = requests.get(f"{IPWHO_URL}{ip}")
    if ip_response.status_code != 200:
        raise HTTPException(status_code=500, detail="Failed to fetch IP info.")

    ip_data = ip_response.json()
    if not ip_data.get("success"):
        raise HTTPException(status_code=400, detail="Invalid IP address.")

    latitude = ip_data.get("latitude")
    longitude = ip_data.get("longitude")
    country = ip_data.get("country")
    region = ip_data.get("region")
    timezone_offset = ip_data.get("timezone", {}).get("offset")

    if not all([latitude, longitude, country, region, timezone_offset]):
        raise HTTPException(status_code=500, detail="Incomplete IP data.")

    time_of_day = get_time_of_day(timezone_offset)

    # Fetch weather data from Open-Meteo
    weather_response = requests.get(
        OPEN_METEO_URL,
        params={"latitude": latitude, "longitude": longitude, "current_weather": True}
    )

    if weather_response.status_code != 200:
        raise HTTPException(status_code=500, detail="Failed to fetch weather data.")

    weather_data = weather_response.json()
    weather_code = weather_data.get("current_weather", {}).get("weathercode", -1)

    return {
        "location": {
            "country": country,
            "region": region
        },
        "time_of_day": time_of_day,  # 0: Early Morning, 1: Morning, 2: Afternoon, 3: Evening/Night, -1: Error
        "weather_code": weather_code  # Open-Meteo weather code
    }
# Example Usage:
# GET /geoip/?ip=8.8.8.8 -> Returns location, time_of_day, and weather_code
