"""
URL configuration for backendRiffRoot project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path
from userauth.views import geoip_view
from rest_framework import routers
from userauth import views  # Import views from the userauth app

router = routers.DefaultRouter()
router.register(r'users', views.UsersViewSet)
router.register(r'playlists', views.PlaylistsViewSet)
router.register(r'songs', views.SongsViewSet)
router.register(r'playlist-songs', views.PlaylistSongsViewSet)
router.register(r'context-info', views.ContextinfoViewSet)
router.register(r'user-preferences', views.UserPreferencesViewSet)

urlpatterns = [
    path("admin/", admin.site.urls),
    path('db/', include(router.urls)),
    path("api/", include("api_gateway.urls")),
    path("api/auth/", include("userauth.urls")),  # Handles login, registration, and Spotify auth
    path("auth/", include("allauth.urls")),  # Required for OAuth2 flows
]
