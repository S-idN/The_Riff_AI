// components/SpotifyPreview.tsx
import React, { useState, useEffect, useRef } from "react";
import { View, TouchableOpacity, ActivityIndicator, Text } from "react-native"; // Added Text
import { Audio, AVPlaybackStatus } from "expo-av";
import { Ionicons } from "@expo/vector-icons";

interface Song {
  id: string; // Important to have a unique ID if possible
  name: string;
  preview_url: string | null;
  artists?: { name: string }[];
  album?: { images?: { url: string }[] };
}

interface SpotifyPreviewProps {
  song: Song;
  // You might need the user's auth token if your new backend endpoint is protected
  // authToken?: string | null;
}

const SpotifyPreview: React.FC<SpotifyPreviewProps> = ({
  song /*, authToken */,
}) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Handles BOTH finding URL and loading sound
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);
  const currentSoundRef = useRef<Audio.Sound | null>(null); // Use ref for sound in cleanup

  // --- Audio Setup Effect ---
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    return () => {
      /* Optional cleanup */
    };
  }, []);

  // --- Sound Loading / Preview Finding Effect ---
  useEffect(() => {
    isMounted.current = true;
    // Reset state when song changes
    setIsPlaying(false);
    setIsLoading(false); // Initially not loading
    setError(null);
    setSound(null); // Clear previous sound state
    currentSoundRef.current = null; // Clear ref

    const findAndLoadSound = async () => {
      let targetPreviewUrl = song.preview_url; // Start with the URL from props

      // --- Step 1: Check if we need to find the URL ---
      if (!targetPreviewUrl) {
        if (!song.name || !song.artists || song.artists.length === 0) {
          setError("Missing track/artist info");
          console.log("Cannot find preview without track/artist name");
          return;
        }

        console.log(
          `No initial preview URL for ${song.name}, asking backend...`
        );
        if (!isMounted.current) return;
        setIsLoading(true); // Start loading indicator (finding URL)
        setError(null);

        try {
          // --- Call the NEW backend endpoint ---
          const response = await fetch(
            "http://127.0.0.1:8000/api/find_spotify_preview/", //
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                // Add Authorization header if your endpoint needs it
                // Authorization: `Bearer ${authToken}`,
              },
              body: JSON.stringify({
                track_name: song.name,
                artist_name: song.artists[0].name, // Send primary artist
              }),
            }
          );

          if (!isMounted.current) return; // Check mount state after fetch

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({})); // Try get error details
            throw new Error(
              `Backend error ${response.status}: ${
                errorData?.error || "Failed to find preview"
              }`
            );
          }

          const data = await response.json();
          targetPreviewUrl = data.preview_url; // Update target URL with backend result

          if (!targetPreviewUrl) {
            console.log(`Backend could not find preview for ${song.name}`);
            setError("No preview available");
            setIsLoading(false);
            return; // Stop if backend found nothing
          }
          console.log(`Backend found preview URL for ${song.name}`);
        } catch (findError: any) {
          if (isMounted.current) {
            console.error("Error finding preview via backend:", findError);
            setError(findError.message || "Could not find preview");
            setIsLoading(false);
          }
          return; // Stop on error
        }
        // setIsLoading(false); // Keep loading true, now we load the sound
      }

      // --- Step 2: Load the sound using targetPreviewUrl ---
      if (!targetPreviewUrl) {
        // This case should be handled above, but double-check
        if (isMounted.current && !error) {
          // Avoid overwriting findError
          setError("No preview available");
        }
        setIsLoading(false); // Ensure loading stops if somehow reached here without URL
        return;
      }

      if (!isMounted.current) return;
      // Ensure loading is true before creating sound
      if (!isLoading) setIsLoading(true);
      setError(null); // Clear previous errors if we have a URL

      console.log(`Loading sound from URL: ${targetPreviewUrl}`);
      try {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: targetPreviewUrl },
          { shouldPlay: false },
          onPlaybackStatusUpdate
        );
        // Check mount state AGAIN after async sound creation
        if (isMounted.current) {
          currentSoundRef.current = newSound; // Store in ref
          setSound(newSound); // Update state
          setIsLoading(false); // FINALLY, loading is done
        } else {
          console.log("Component unmounted during sound load, unloading.");
          newSound.unloadAsync(); // Unload if unmounted during load
        }
      } catch (loadError: any) {
        if (isMounted.current) {
          console.error("Error loading sound:", loadError);
          setError("Could not load preview.");
          setIsLoading(false);
          setSound(null);
          currentSoundRef.current = null;
        }
      }
    };

    findAndLoadSound();

    // --- Cleanup Function ---
    return () => {
      isMounted.current = false;
      console.log(`Unloading sound for ${song.name} (Cleanup Effect)`);
      // Unload the sound using the ref
      currentSoundRef.current
        ?.unloadAsync()
        .catch((e) =>
          console.error("Error unloading sound during cleanup:", e)
        );
      currentSoundRef.current = null; // Clear ref on cleanup
      // No need to setSound(null) here, state is reset on next render/effect run
    };
    // Depend on song ID or unique identifier if available, otherwise name/artist combo
  }, [song.id, song.name, song.artists?.[0]?.name /*, authToken */]); // Adjust dependencies

  // --- Playback Status Update Handler (Keep As Is) ---
  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    // ... (Your existing corrected onPlaybackStatusUpdate logic) ...
    if (!isMounted.current) return; // Don't update state if unmounted

    // --- Handle the case where the status indicates an ERROR ---
    if (!status.isLoaded) {
      // If the status is not loaded, it implies an error or unload.
      // Check specifically for the error property on AVPlaybackStatusError.
      if (status.error) {
        console.error(`Playback Status Error: ${status.error}`);
        setError(`Playback Error: ${status.error}`);
        setIsPlaying(false);
        setIsLoading(false); // Ensure loading is also false on error
        // Consider unloading the sound completely on error to clean up
        // sound?.unloadAsync(); // Uncomment if desired, but careful not to cause loops
        // setSound(null);       // Uncomment if desired
      } else {
        // If not loaded and no error, it might be unloaded normally.
        // Ensure states reflect this if needed (often handled by cleanup effect)
        // setIsPlaying(false); // Usually already handled
        // setIsLoading(false); // Usually already handled
      }
      return; // Exit early if not loaded
    }

    // --- Handle the case where the status indicates SUCCESS (isLoaded is true) ---
    // Now we know status is AVPlaybackStatusSuccess

    setIsPlaying(status.isPlaying);
    // Update loading state based on buffering status
    // Note: isBuffering might be true even when playing starts
    setIsLoading(status.isBuffering && !status.isPlaying); // More precise: loading = buffering AND not playing yet

    // Check if playback just finished
    if (status.didJustFinish && !status.isLooping) {
      // Added !isLooping check for clarity
      console.log("Preview finished playing.");
      // Reset position to start if needed, or just update state
      currentSoundRef.current
        ?.setPositionAsync(0)
        .catch((e) => console.warn("Could not reset position:", e)); // Reset position optional
      // setIsPlaying(false); // status.isPlaying should be false now, so this is redundant but safe
    }
  };

  // --- Play/Pause Toggle Function (Keep As Is) ---
  const togglePlayback = async () => {
    // Use the sound from the ref for actions to ensure consistency
    const currentSound = currentSoundRef.current;
    if (isLoading || !currentSound || error) return;

    if (isPlaying) {
      console.log("Pausing sound");
      try {
        await currentSound.pauseAsync();
        // onPlaybackStatusUpdate handles setIsPlaying(false)
      } catch (e) {
        console.error("Error pausing sound:", e);
        setError("Could not pause preview.");
      }
    } else {
      console.log("Playing sound");
      try {
        await currentSound.playAsync();
        // onPlaybackStatusUpdate handles setIsPlaying(true)
      } catch (e) {
        console.error("Error playing sound:", e);
        setError("Could not play preview.");
      }
    }
  };

  // --- Render ---
  const renderIcon = () => {
    // Show loading if we are finding URL OR loading sound
    if (isLoading) {
      return <ActivityIndicator size="small" color="#1DB954" />;
    }
    // Show error if finding/loading failed or playback failed
    if (error) {
      return <Ionicons name="alert-circle-outline" size={24} color="red" />;
    }
    // Disable play if no sound object exists yet (even if no error/not loading)
    if (!sound) {
      return <Ionicons name="play-circle-outline" size={24} color="gray" />; // Indicate disabled/unavailable
    }
    // Show play/pause based on state if sound is ready
    if (isPlaying) {
      return <Ionicons name="pause" size={24} color="#1DB954" />;
    }
    return <Ionicons name="play" size={24} color="#1DB954" />;
  };

  // Button is disabled if loading, error exists, or sound isn't ready
  const isDisabled = isLoading || !!error || !sound;

  return (
    <View className="flex-row items-center p-2">
      <TouchableOpacity
        onPress={togglePlayback}
        disabled={isDisabled}
        className={`w-10 h-10 rounded-full items-center justify-center ${
          isDisabled ? "bg-gray-600" : "bg-white"
        }`}
      >
        {renderIcon()}
      </TouchableOpacity>
      {/* Optional: Display specific error message for debugging */}
      {/* {error && <Text className="text-red-500 text-xs ml-1 w-16" numberOfLines={2}>{error}</Text>} */}
    </View>
  );
};

export default SpotifyPreview;
