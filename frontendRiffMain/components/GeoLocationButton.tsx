// src/components/GeoLocationButton.tsx (Keeping the original filename)

import React, { useState } from "react";
import { StyleSheet } from "react-native";
import {
  Text,
  YStack,
  Spinner,
  Stack,
  styled,
  ScrollView,
  Image,
  XStack,
} from "tamagui";
import { LinearGradient as TamaguiLinearGradient } from "@tamagui/linear-gradient";
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Link, Href } from "expo-router";

// Animated components
const AnimatedText = Animated.createAnimatedComponent(Text);
const AnimatedStack = Animated.createAnimatedComponent(Stack);

// --- Interfaces ---
interface GeoLocationResponse {
  status: "success" | "fail";
  message?: string;
  country?: string;
  countryCode?: string;
  city?: string;
  regionName?: string;
  query?: string;
}

interface Song {
  name: string;
  artist: string;
  spotify_url: string;
  lastfm_url?: string;
  image_url?: string | null;
}

interface BackendRecommendationsResponse {
  songs?: Song[];
  error?: string;
  geoip_disabled?: boolean; // Backend might still return this based on its logic
}

// --- Component Props ---
interface GeoLocationButtonProps {
  emotion: string;
  mood: string;
  token: string | null; // IMPORTANT: This should be the Spotify Access Token
}

// --- Backend URL ---
const BACKEND_URL = "http://127.0.0.1:8000"; // Ensure this is correct

// --- Component ---
// Note: Component name kept as GeoLocationButton, but primary function
// is now fetching location-aware recommendations.
const GeoLocationButton: React.FC<GeoLocationButtonProps> = ({
  emotion,
  mood,
  token, // Expecting Spotify Token here
}) => {
  const [recommendations, setRecommendations] = useState<Song[] | null>(null);
  const [displayedLocation, setDisplayedLocation] = useState<{
    city: string | null;
    country: string | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState<string | null>(null);

  const hover = useSharedValue(0);
  const gesture = Gesture.Hover()
    .onBegin(() => {
      hover.value = withTiming(1, { duration: 200 });
    })
    .onEnd(() => {
      hover.value = withTiming(0, { duration: 200 });
    });

  const gradientOverlayStyle = useAnimatedStyle(() => ({
    opacity: hover.value,
  }));
  const baseTextStyle = useAnimatedStyle(() => ({ opacity: 1 - hover.value }));
  const blackTextStyle = useAnimatedStyle(() => ({ opacity: hover.value }));

  const handleFetchRecommendations = async () => {
    if (!token) {
      setError("Authentication token is missing.");
      return;
    }
    if (!emotion || !mood) {
      setError("Emotion and Mood inputs are required.");
      return;
    }
    if (isLoading) return;

    setIsLoading(true);
    setLoadingStep("Fetching Location...");
    setError(null);
    setRecommendations(null);
    setDisplayedLocation(null);

    let geoData: GeoLocationResponse | null = null;

    try {
      // 1. Fetch GeoIP client-side
      console.log("Fetching GeoIP directly from ip-api...");
      const geoResponse = await fetch("http://ip-api.com/json/");
      if (!geoResponse.ok)
        throw new Error(`GeoIP fetch failed: ${geoResponse.statusText}`);
      geoData = await geoResponse.json();
      if (geoData?.status === "fail")
        throw new Error(`GeoIP API error: ${geoData.message || "Unknown"}`);
      console.log("GeoIP Data:", geoData);
      setDisplayedLocation({
        city: geoData?.city || null,
        country: geoData?.country || null,
      });

      // 2. Call Django Backend
      setLoadingStep("Fetching Recommendations...");
      const countryCode = geoData?.countryCode || ""; // For Spotify 'market' param
      const city = geoData?.city || ""; // Keep sending city, backend might log it
      const requestBody = {
        emotion: emotion.toLowerCase(),
        mood: mood.toLowerCase(),
        country_code: countryCode.toUpperCase(), // Send UPPERCASE code for Spotify market
        city: city.toLowerCase(),
        // Pass country name if backend still uses it for logging/fallback
        country: geoData?.country || "",
      };
      const apiUrl = `${BACKEND_URL}/api/get_mood_recommendations/`;
      const backendResponse = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // This MUST be the Spotify Token now
        },
        body: JSON.stringify(requestBody),
      });
      if (!backendResponse.ok) {
        let backendError = `Backend error: ${backendResponse.statusText} (${backendResponse.status})`; // Add status
        try {
          const errorJson = await backendResponse.json();
          if (errorJson.error) backendError = errorJson.error;
        } catch (e) {}
        // Handle potential 401 from backend if Spotify token is invalid
        if (backendResponse.status === 401) {
          backendError =
            "Spotify authorization failed. Please try logging in again.";
        }
        throw new Error(backendError);
      }
      const data: BackendRecommendationsResponse = await backendResponse.json();
      if (data.error) throw new Error(`Backend error: ${data.error}`);
      if (data.geoip_disabled) {
        console.log("Backend indicated GeoIP was disabled or not used.");
      }
      setRecommendations(data.songs || []);
    } catch (err: any) {
      console.error("Recommendation Fetch Error:", err);
      setError(err.message || "Failed to fetch recommendations.");
      setDisplayedLocation(null);
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  // --- Styling Colors ---
  const baseGradientColors = ["#0D1117", "#0D1127"];
  const hoverGradientColors = ["#73e8f5", "#00b08d"]; // Teal hover
  const textBaseApproxColor = "#73e8f5"; // Teal base text
  const textHoverColor = "black";
  const buttonText = isLoading ? loadingStep : "Get Location Recs";
  const spinnerColor = "$gray10"; // Use a neutral spinner color

  return (
    <YStack alignItems="center" padding="$4" space="$4" scale={0.8}>
      {/* --- Button --- */}
      <GestureDetector gesture={gesture}>
        <Stack
          tag="pressable"
          onPress={handleFetchRecommendations}
          disabled={isLoading}
          borderRadius="$6"
          overflow="hidden"
          opacity={isLoading ? 0.7 : 1}
          pressStyle={{ opacity: 0.9 }}
        >
          {/* ... Gradients ... */}
          <TamaguiLinearGradient
            colors={baseGradientColors}
            fullscreen
            borderRadius="$6"
          />
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
                color={spinnerColor} // Use neutral color
                position="absolute"
                right="$3"
                top="$3"
              />
            )}
          </YStack>
        </Stack>
      </GestureDetector>
      {/* --- End Button --- */}

      {/* --- Display Area --- */}
      <YStack width="100%" minHeight={50} alignItems="stretch" space="$3">
        {/* Location Display */}
        {displayedLocation && !isLoading && (
          <YStack alignItems="center" paddingVertical="$2" space="$1">
            <Text color="$gray10" fontSize="$3" fontWeight="500">
              Detected Location:
            </Text>
            <Text color="$gray11" fontSize="$4">
              {displayedLocation.city || "N/A"},{" "}
              {displayedLocation.country || "N/A"}
            </Text>
          </YStack>
        )}

        {/* Error Display */}
        {error && (
          <Text color="$red10" textAlign="center" padding="$2">
            Error: {error}
          </Text>
        )}

        {/* Recommendations List */}
        {recommendations && recommendations.length > 0 && (
          <ScrollView
            width="100%"
            maxHeight={400}
            showsVerticalScrollIndicator={false}
          >
            <YStack space="$3" paddingVertical="$2">
              <Text
                fontSize="$4"
                fontWeight="bold"
                color="$gray12"
                textAlign="center"
                marginBottom="$2"
              >
                Recommendations:
              </Text>
              {recommendations.map((song, index) => (
                <Link
                  key={`${song.name}-${song.artist}-${index}`}
                  href={song.spotify_url as Href}
                  target="_blank"
                  asChild
                >
                  <XStack
                    tag="pressable"
                    background="$gray3"
                    padding="$3"
                    borderRadius="$4"
                    alignContent="center"
                    space="$3"
                    hoverStyle={{ background: "$gray4" }}
                    pressStyle={{ background: "$gray5", scale: 0.98 }}
                    borderWidth={1}
                    borderColor="$gray5"
                  >
                    {/* Image/Placeholder */}
                    {song.image_url ? (
                      <Image
                        source={{ uri: song.image_url, width: 50, height: 50 }}
                      />
                    ) : (
                      <Stack
                        width={50}
                        height={50}
                        background="$gray6"
                        borderRadius="$3"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Text fontSize="$2" color="$gray10">
                          ?
                        </Text>
                      </Stack>
                    )}
                    {/* Song Info */}
                    <YStack flex={1} space="$1">
                      <Text
                        fontWeight="600"
                        color="$gray12"
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {song.name}
                      </Text>
                      <Text
                        color="$gray11"
                        fontSize="$3"
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {song.artist}
                      </Text>
                    </YStack>
                  </XStack>
                </Link>
              ))}
            </YStack>
          </ScrollView>
        )}

        {/* No Recommendations Message */}
        {recommendations &&
          recommendations.length === 0 &&
          !isLoading &&
          !error && (
            <Text color="$gray10" padding="$2" textAlign="center">
              No specific recommendations found.
            </Text>
          )}
      </YStack>
      {/* --- END Display Area --- */}
    </YStack>
  );
};

export default GeoLocationButton;
