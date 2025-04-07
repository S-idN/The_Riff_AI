from rest_framework import serializers
from .models import Users, Playlists, Songs, PlaylistSongs, Contextinfo, UserPreferences

class UsersSerializer(serializers.ModelSerializer):
    class Meta:
        model = Users
        fields = '__all__'

class PlaylistsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Playlists
        fields = '__all__'

class SongsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Songs
        fields = '__all__'

class PlaylistSongsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlaylistSongs
        fields = '__all__'

class ContextinfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contextinfo
        fields = '__all__'

class UserPreferencesSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPreferences
        fields = '__all__'