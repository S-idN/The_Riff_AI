from django.db import models

class Users(models.Model):
    username = models.CharField(max_length=255)
    password = models.CharField(max_length=255)
    date_joined = models.DateTimeField()
    last_login = models.DateTimeField()
    subscription_tier = models.CharField(max_length=255)  # Assuming this is a string-based enum
    social_credit = models.BigIntegerField()

    def __str__(self):
        return self.username

class Playlists(models.Model):
    id = models.CharField(max_length=36, primary_key=True)  # Assuming char(36) represents a UUID or similar
    name = models.CharField(max_length=255)
    user = models.ForeignKey(Users, on_delete=models.CASCADE)
    time_of_creation = models.DateTimeField()

    def __str__(self):
        return self.name

class Songs(models.Model):
    id = models.CharField(max_length=36, primary_key=True)  # Assuming char(36) represents a UUID or similar
    title = models.CharField(max_length=255)
    artist = models.CharField(max_length=255)
    album = models.CharField(max_length=255)
    duration = models.CharField(max_length=255)
    genre = models.CharField(max_length=255)
    release_date = models.DateField()
    spotify_id = models.CharField(max_length=255)
    mood_tags = models.CharField(max_length=255)
    artist_follower_count = models.BigIntegerField()

    def __str__(self):
        return self.title

class PlaylistSongs(models.Model):
    playlist = models.ForeignKey(Playlists, on_delete=models.CASCADE)
    song = models.ForeignKey(Songs, on_delete=models.CASCADE)
    song_order = models.IntegerField()

    class Meta:
        unique_together = ('playlist', 'song', 'song_order') # Assuming song order is unique within a playlist

    def __str__(self):
        return f"Song {self.song_order} in {self.playlist.name}"

class Contextinfo(models.Model):
    pid = models.CharField(max_length=255, primary_key=True)
    user = models.ForeignKey(Users, on_delete=models.CASCADE)
    weather = models.CharField(max_length=255)
    time_of_day = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    activity = models.CharField(max_length=255)

    def __str__(self):
        return self.pid

class UserPreferences(models.Model):
    id = models.CharField(max_length=30, primary_key=True)
    user = models.ForeignKey(Users, on_delete=models.CASCADE)
    preferred_genres = models.CharField(max_length=255)
    preferred_moods = models.CharField(max_length=255)
    favorite_artists = models.CharField(max_length=255)

    def __str__(self):
        return self.id