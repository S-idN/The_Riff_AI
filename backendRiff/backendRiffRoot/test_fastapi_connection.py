"""
Test script for checking connections to FastAPI backend.
Run this to verify if FastAPI is accessible from Django.
"""

import os
import sys
import requests
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backendRiffRoot.settings')
django.setup()

from django.conf import settings

def test_connection():
    """Test connection to FastAPI services."""
    print("Testing FastAPI connections...")
    print(f"USER_INPUT_API_URL: {settings.USER_INPUT_API_URL}")
    print(f"GEOIP_API_URL: {settings.GEOIP_API_URL}")
    print(f"LASTFM_API_URL: {settings.LASTFM_API_URL}")
    
    # Test User Input API
    try:
        response = requests.get(f"{settings.USER_INPUT_API_URL.rstrip('/')}", timeout=5)
        print(f"User Input API response: {response.status_code}")
    except Exception as e:
        print(f"User Input API error: {str(e)}")
    
    # Test specific endpoint
    try:
        test_text = "I am happy today"
        response = requests.post(
            f"{settings.USER_INPUT_API_URL}/analyze_text",
            json={"text": test_text},
            timeout=5
        )
        print(f"Analyze text endpoint response: {response.status_code}")
        if response.status_code == 200:
            print(f"Response data: {response.json()}")
    except Exception as e:
        print(f"Analyze text endpoint error: {str(e)}")
    
    # Test ping to FastAPI base URL
    api_base = settings.USER_INPUT_API_URL.split('/')[0] + '//' + settings.USER_INPUT_API_URL.split('/')[2]
    try:
        response = requests.get(f"{api_base}/", timeout=5)
        print(f"FastAPI base URL response: {response.status_code}")
    except Exception as e:
        print(f"FastAPI base URL error: {str(e)}")

if __name__ == "__main__":
    test_connection() 