# main.py
from fastapi import FastAPI
from services.geoip_service import geoip_router
from services.userinput_service import input_router
"""from services.ai_model_service import ai_model_router"""

app = FastAPI()

# Registering the routers
app.include_router(geoip_router, prefix="/geoip", tags=["GeoIP"])
app.include_router(input_router, prefix="/user_input", tags=["User Input"])
"""app.include_router(ai_model_router, prefix="/ai_model", tags=["AI Model"])"""

@app.get("/")
async def root():
    return {"message": "Welcome to the playlist generator API!"}
