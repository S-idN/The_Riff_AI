// src/components/CreateLocationPlaylistButton.tsx

import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { Text, YStack, Spinner, Stack, styled } from "tamagui";
import { LinearGradient as TamaguiLinearGradient } from "@tamagui/linear-gradient";
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
// Removed imports not used here: ScrollView, Image, XStack, Link, Href

// Animated components
const AnimatedText = Animated.createAnimatedComponent(Text);
const AnimatedStack = Animated.createAnimatedComponent(Stack);

// --- Interfaces ---
interface SongInput {
  // Input format expected by backend
  name: string;
  artist: string;
}

// --- Component Props ---
interface CreateLocationPlaylistButtonProps {
  emotion?: string | null; // Emotion for playlist name
  country?: string | null; // Country for playlist name
  token: string | null; // Spotify Auth Token
  songs?: SongInput[]; // List of songs to add
  playlistDescription?: string; // Optional description
  isPublic?: boolean; // Optional public/private flag
  onSuccess?: (playlistData: any) => void; // Optional success callback
  onError?: (error: string) => void; // Optional error callback
}

// --- Backend URL ---
const BACKEND_URL = "http://127.0.0.1:8000"; // Ensure this is correct

// --- Component ---
const CreateLocationPlaylistButton: React.FC<
  CreateLocationPlaylistButtonProps
> = ({
  emotion,
  country,
  token,
  songs = [], // Default to empty array
  playlistDescription = "Created with Riff AI based on location and mood.", // Default description
  isPublic = true, // Default to public
  onSuccess,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); // Optional: display error below button

  // Reanimated value for hover animation
  const hover = useSharedValue(0);

  // Gesture Handler for Hover
  const gesture = Gesture.Hover()
    .onBegin(() => {
      hover.value = withTiming(1, { duration: 200 });
    })
    .onEnd(() => {
      hover.value = withTiming(0, { duration: 200 });
    });

  // Animated styles (copied from GeoLocationButton)
  const gradientOverlayStyle = useAnimatedStyle(() => ({
    opacity: hover.value,
  }));
  const baseTextStyle = useAnimatedStyle(() => ({ opacity: 1 - hover.value }));
  const blackTextStyle = useAnimatedStyle(() => ({ opacity: hover.value }));

  // --- Playlist Name Generation ---
  const generatePlaylistName = (): string => {
    const emotionName = emotion
      ? emotion.charAt(0).toUpperCase() + emotion.slice(1).toLowerCase()
      : null;
    const countryName = country || null; // Use country name directly if available

    if (countryName && emotionName) {
      return `${countryName} ${emotionName} Vibes`;
    } else if (emotionName) {
      return `${emotionName} Vibes`;
    } else if (countryName) {
      return `${countryName} Mix`;
    }
    return "Riff AI Playlist"; // Default fallback
  };

  // --- Playlist Creation Handler ---
  const handleCreatePlaylist = async () => {
    // Validate required props
    if (!token) {
      onError?.("Authentication token is missing.");
      return;
    }
    if (!emotion) {
      onError?.("Emotion data is missing.");
      return;
    }
    if (!country) {
      onError?.("Country data is missing.");
      return;
    }
    if (!songs || songs.length === 0) {
      onError?.("No songs provided to create playlist.");
      return;
    }
    if (isLoading) return;

    setIsLoading(true);
    setError(null); // Clear previous errors

    const generatedName = generatePlaylistName();
    const requestBody = {
      name: generatedName,
      description: playlistDescription,
      public: isPublic,
      songs: songs,
    };

    console.log("Sending playlist creation request:", requestBody);

    try {
      const apiUrl = `${BACKEND_URL}/api/auth/create-playlist/`; // Correct endpoint
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`, // Use the passed Spotify token
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json(); // Try parsing JSON regardless of status for error messages

      if (!response.ok) {
        // Throw error with message from backend if available
        throw new Error(
          data?.error || `Failed to create playlist (${response.status})`
        );
      }

      console.log("Playlist created successfully:", data);
      onSuccess?.(data); // Pass potential playlist data back
    } catch (err: any) {
      console.error("Playlist Creation Error:", err);
      const errorMessage = err.message || "Failed to create playlist.";
      setError(errorMessage); // Set error state for display
      onError?.(errorMessage); // Call error callback
    } finally {
      setIsLoading(false);
    }
  };

  // --- Styling Colors (copied from GeoLocationButton) ---
  const baseGradientColors = ["#0D1117", "#0D1127"];
  const hoverGradientColors = ["#73e8f5", "#00b08d"]; // Teal hover
  const textBaseApproxColor = "#73e8f5"; // Teal base text
  const textHoverColor = "black";
  const spinnerColor = "$gray10"; // Use a neutral spinner color

  // Button Text Logic
  const buttonText = isLoading ? "Creating..." : "Create Spotify Playlist";
  // Disable button logic
  const isDisabled =
    isLoading || !token || !emotion || !country || !songs || songs.length === 0;

  return (
    // Keep scale if desired from parent context, or remove if button should be full size
    <YStack alignItems="center" space="$2">
      {" "}
      {/* Reduced space */}
      {/* --- Button (Styled like GeoLocationButton) --- */}
      <GestureDetector gesture={gesture}>
        <Stack
          tag="pressable"
          onPress={handleCreatePlaylist} // Call the create playlist handler
          disabled={isDisabled} // Use combined disabled state
          borderRadius="$6"
          overflow="hidden"
          opacity={isDisabled ? 0.7 : 1} // Dim if disabled
          pressStyle={{ opacity: 0.9 }}
        >
          {/* Base dark gradient */}
          <TamaguiLinearGradient
            colors={baseGradientColors}
            fullscreen
            borderRadius="$6"
          />
          {/* Animated hover gradient */}
          <AnimatedStack
            style={[StyleSheet.absoluteFillObject, gradientOverlayStyle]}
            borderRadius="$6"
          >
            <TamaguiLinearGradient
              colors={hoverGradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              fullscreen
              borderRadius="$6"
            />
          </AnimatedStack>
          {/* Content Area (Text + Spinner) */}
          <YStack
            position="relative"
            paddingHorizontal="$6"
            paddingVertical="$3"
            alignItems="center"
            justifyContent="center"
          >
            {/* Base Text (fades out) */}
            <AnimatedText
              style={baseTextStyle}
              fontSize="$5"
              fontWeight="700"
              color={textBaseApproxColor}
              textAlign="center"
            >
              {buttonText}
            </AnimatedText>
            {/* Hover Text (fades in) */}
            <AnimatedStack
              style={[StyleSheet.absoluteFillObject, blackTextStyle]}
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize="$5" fontWeight="700" color={textHoverColor}>
                {buttonText}
              </Text>
            </AnimatedStack>
            {/* Spinner positioned absolutely */}
            {isLoading && (
              <Spinner
                size="small"
                color={spinnerColor}
                position="absolute"
                right="$3"
                top="$3"
              />
            )}
          </YStack>
        </Stack>
      </GestureDetector>
      {/* --- End Button --- */}
      {/* --- Display Area for Error --- */}
      {/* Only show error related to this button's action */}
      {error && (
        <Text color="$red10" textAlign="center" fontSize="$2">
          {error}
        </Text>
      )}
      {/* Optional: Show message if required props are missing */}
      {!isLoading &&
        (!token || !emotion || !country || !songs || songs.length === 0) && (
          <Text color="$gray10" textAlign="center" fontSize="$2">
            (Requires login, location, emotion, and songs)
          </Text>
        )}
    </YStack>
  );
};

// Export the new component name
export default CreateLocationPlaylistButton;
