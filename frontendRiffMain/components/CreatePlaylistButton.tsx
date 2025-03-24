import React, { useState } from "react";
import { Button, YStack, Text, Spinner } from "tamagui";
import { useAuth } from "../context/AuthContext";

interface Song {
  name: string;
  artist: string;
}

interface CreatePlaylistButtonProps {
  playlistName?: string;
  playlistDescription?: string;
  isPublic?: boolean;
  songs?: Song[];
  emotion?: string;
  mood?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function CreatePlaylistButton({
  playlistName,
  playlistDescription = "Created by Riff AI",
  isPublic = true,
  songs = [],
  emotion,
  mood,
  onSuccess,
  onError,
}: CreatePlaylistButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuth();

  // Generate playlist name based on emotion and mood
  const generatePlaylistName = () => {
    if (playlistName) return playlistName;

    const emotionName = emotion?.toLowerCase() || "";
    const moodName = mood?.toLowerCase() || "";

    if (emotionName && moodName) {
      return `${
        emotionName.charAt(0).toUpperCase() + emotionName.slice(1)
      } ${moodName} Vibes`;
    } else if (emotionName) {
      return `${
        emotionName.charAt(0).toUpperCase() + emotionName.slice(1)
      } Vibes`;
    } else if (moodName) {
      return `${moodName.charAt(0).toUpperCase() + moodName.slice(1)} Vibes`;
    }

    return "Riff AI Playlist";
  };

  const handleCreatePlaylist = async () => {
    if (!token) {
      onError?.("Please log in with Spotify first");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        "http://localhost:8000/api/auth/create-playlist/",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: generatePlaylistName(),
            description: playlistDescription,
            public: isPublic,
            songs: songs,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create playlist");
      }

      onSuccess?.();
    } catch (error) {
      onError?.(
        error instanceof Error ? error.message : "Failed to create playlist"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <YStack space="$2">
      <Button
        onPress={handleCreatePlaylist}
        disabled={isLoading || !token}
        backgroundColor={token ? "#1DB954" : "#666"}
        color="white"
        borderRadius="$4"
        padding="$3"
      >
        {isLoading ? (
          <Spinner color="white" />
        ) : (
          <Text color="white" fontWeight="bold">
            Create Spotify Playlist
          </Text>
        )}
      </Button>
      {!token && (
        <Text color="$red10" textAlign="center">
          Please log in with Spotify to create playlists
        </Text>
      )}
    </YStack>
  );
}
