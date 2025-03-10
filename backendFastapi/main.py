from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from services.geoip_service import geoip_router
from services.userinput_service import input_router

app = FastAPI()

# Proper CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8081"],  # Change '*' to only allow specific origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Registering the routers
app.include_router(geoip_router, prefix="/geoip", tags=["GeoIP"])
app.include_router(input_router, prefix="/user_input", tags=["User Input"])

@app.get("/")
async def root():
    return JSONResponse(content={"message": "Welcome to the API!"})