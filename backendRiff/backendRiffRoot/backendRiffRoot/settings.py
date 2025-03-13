import os
from pathlib import Path
import platform
import socket
from dotenv import load_dotenv
import environ
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI

# Load environment variables
load_dotenv()

app = FastAPI()

env = environ.Env()
environ.Env.read_env()

USER_INPUT_API_URL = env("USER_INPUT_API_URL", default="http://127.0.0.1:8001/user_input/")
GEOIP_API_URL = env("GEOIP_API_URL", default="http://127.0.0.1:8002/geoip/")
LOCAL_IP = "192.168.1.7"
ANDROID_EMULATOR_IP = "10.0.2.2"
# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "your_default_secret_key")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv("DEBUG", "True") == "True"

LOCAL_IP = "192.168.1.7"  # Your PC's local network IP
ANDROID_EMULATOR_IP = "10.0.2.2"

# Determine the correct redirect URI
if platform.system() in ["Windows", "Darwin"]:  # PC (Mac or Windows) - Web App
    SPOTIFY_REDIRECT_URI = "http://localhost:8081/auth-callback"
elif platform.system() == "Linux":  # Android Emulator (assumed Linux)
    SPOTIFY_REDIRECT_URI = f"http://{ANDROID_EMULATOR_IP}:8081/auth-callback"
else:  # Physical Android Device
    SPOTIFY_REDIRECT_URI = f"http://{LOCAL_IP}:8081/auth-callback"

ALLOWED_HOSTS = [
    "192.168.1.7",
    "localhost",
    "0.0.0.0",
    "http://10.0.2.2:8000",
    "127.0.0.1",
    LOCAL_IP,
    ANDROID_EMULATOR_IP,
    os.getenv("ALLOWED_HOSTS_EXTRA", "localhost"),  # Additional allowed hosts
]

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:8000",
    "http://127.0.0.1:8001",
    "http://192.168.1.7:8000",  # Your PC's local network IP (for physical devices)
    "http://10.0.2.2:8000",  # Android Emulator's loopback to PC
    "exp://192.168.1.7:8081",
]

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

if not os.getenv("DEBUG", "True") == "True":  # Assuming DEBUG is set in the .env file
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'allauth.account.middleware.AccountMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
]

ROOT_URLCONF = 'backendRiffRoot.urls'

CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOWED_ORIGINS = [
    "http://localhost:8081",  # Frontend (local)
    "http://127.0.0.1:8081",  # Frontend alternative
    "http://localhost:8000",  # Backend (Django running locally)
    "http://127.0.0.1:8000",  # Backend alternative
    "http://localhost:8001",  # FastAPI backend
    "http://127.0.0.1:8001",  # FastAPI alternative
    f"http://{LOCAL_IP}:8081",  # Local frontend (PC or mobile)
    f"http://{ANDROID_EMULATOR_IP}:8081",  # Android Emulator frontend
    "http://192.168.1.7:8081",  # Expo development server (PC’s local IP)
    "http://192.168.1.7:8000",  # Django backend (PC’s local IP)
    "http://10.0.2.2:8000",  # Android Emulator (loopback to PC)
    "http://192.168.1.7:19000",  # Expo Metro Bundler
    "http://192.168.1.7:19006",  # Expo Web Preview (if using web)
]


CORS_ALLOW_CREDENTIALS = True

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backendRiffRoot.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework',
    'rest_framework.authtoken',
    'dj_rest_auth',
    'userauth',
    'api_gateway',
    'django.contrib.sites',
    'dj_rest_auth.registration',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.spotify',
]

REST_AUTH = {
    'USE_JWT': True,
    'JWT_AUTH_COOKIE': 'djangojwtauth_cookie',
    'JWT_AUTH_REFRESH_COOKIE': 'djangojwtauth_refresh_cookie'
}

REST_AUTH_REGISTER_SERIALIZERS = {
    "REGISTER_SERIALIZER": "dj_rest_auth.registration.serializers.RegisterSerializer",
}

SITE_ID = 1

ACCOUNT_EMAIL_VERIFICATION = "none"
ACCOUNT_ADAPTER = "allauth.account.adapter.DefaultAccountAdapter"
SOCIALACCOUNT_ADAPTER = "allauth.socialaccount.adapter.DefaultSocialAccountAdapter"
SOCIALACCOUNT_PROVIDERS = {
    "spotify": {
        "SCOPE": ["user-read-email", "user-read-private"],
        "AUTH_PARAMS": {"show_dialog": "true"},
        "APP": {
            "client_id": os.getenv("SPOTIFY_CLIENT_ID"),
            "secret": os.getenv("SPOTIFY_CLIENT_SECRET"),
            "key": "",
        }
    }
}

AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
    "allauth.account.auth_backends.AuthenticationBackend",
]

# Adjust login redirect URL
LOCAL_IP = "192.168.1.7"  # Your PC’s local IP
ANDROID_EMULATOR_IP = "10.0.2.2"

# Default to localhost for web/PC development
LOGIN_REDIRECT_URL = "http://localhost:8081/"

# Check if running in an Expo environment (Mobile)
if os.getenv("EXPO_DEV"):
    LOGIN_REDIRECT_URL = f"http://{LOCAL_IP}:8081/"

# If running on an Android emulator
if os.getenv("ANDROID_EMULATOR"):
    LOGIN_REDIRECT_URL = f"http://{ANDROID_EMULATOR_IP}:8081/"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "dj_rest_auth.jwt_auth.JWTCookieAuthentication",
        "rest_framework.authentication.SessionAuthentication",
        "rest_framework.authentication.TokenAuthentication",
    ],
}

REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.AllowAny',
    ),
}

ACCOUNT_LOGIN_METHODS = {'username'}
ACCOUNT_EMAIL_REQUIRED = False

REST_USE_JWT = True
REST_SESSION_LOGIN = True

# Set Spotify credentials securely from environment
SOCIALACCOUNT_PROVIDERS["spotify"]["APP"] = {
    "client_id": os.getenv("SPOTIFY_CLIENT_ID"),
    "secret": os.getenv("SPOTIFY_CLIENT_SECRET"),
}
