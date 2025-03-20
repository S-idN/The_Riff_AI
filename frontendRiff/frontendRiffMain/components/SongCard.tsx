import React, { useState, useEffect, useMemo } from "react";
import { XStack, YStack, Text, Card, Image, Stack } from "tamagui";
import { Linking, Animated, Platform, useWindowDimensions } from "react-native";
import { ActivityIndicator, Pressable } from "react-native";

// Re-use the Song interface from the main app
interface Song {
  name: string;
  artist: string;
  url: string;
  spotify_url: string;
  image_url: string;
}

interface SongCardProps {
  song: Song;
  onPress?: () => void;
  delay?: number; // Delay for staggered animation
}

export function SongCard({ song, onPress, delay = 0 }: SongCardProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const { width } = useWindowDimensions();

  // Memoize these values to prevent recalculation on every render
  const { isMobile, cardWidth, imageSize, titleSize, artistSize } =
    useMemo(() => {
      const isMobile = Platform.OS !== "web" || width < 768;
      return {
        isMobile,
        cardWidth: isMobile ? "100%" : Math.min(400, width * 0.8),
        imageSize: isMobile ? 40 : 50,
        titleSize: isMobile ? "$2" : "$3",
        artistSize: isMobile ? "$1" : "$2",
      };
    }, [width]); // Only recalculate when width changes

  useEffect(() => {
    // Start fade-in animation after delay
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      delay: delay,
      useNativeDriver: true,
    }).start();
  }, [delay]); // Only run when delay changes

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (imageLoading) {
        setImageLoading(false);
        setImageError(true);
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timeout);
  }, [imageLoading]);

  const handlePress = async () => {
    if (onPress) {
      onPress();
    } else if (song.spotify_url) {
      try {
        await Linking.openURL(song.spotify_url);
      } catch (error) {
        console.error("Error opening Spotify URL:", error);
      }
    }
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        width: "100%",
        maxWidth: typeof cardWidth === "number" ? cardWidth : undefined,
        alignSelf: "center",
      }}
    >
      <Pressable onPress={handlePress}>
        <Card
          elevate
          size="$2"
          bordered
          animation="bouncy"
          scale={0.9}
          hoverStyle={{ scale: 0.925 }}
          pressStyle={{ scale: 0.875 }}
          style={{
            marginVertical: isMobile ? 3 : 5,
            width: "100%",
          }}
        >
          <XStack
            padding={isMobile ? "$1" : "$2"}
            space={isMobile ? "$1" : "$2"}
            alignItems="center"
          >
            {song.image_url ? (
              <Stack>
                {imageLoading && (
                  <ActivityIndicator
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: [
                        { translateX: -imageSize / 4 },
                        { translateY: -imageSize / 4 },
                      ],
                    }}
                  />
                )}
                <Image
                  source={{ uri: song.image_url }}
                  style={{
                    width: imageSize,
                    height: imageSize,
                    borderRadius: 4,
                    display: imageError ? "none" : "flex",
                  }}
                  onLoadStart={() => setImageLoading(true)}
                  onLoadEnd={() => {
                    setImageLoading(false);
                    setImageError(false);
                  }}
                  onError={() => {
                    setImageError(true);
                    setImageLoading(false);
                  }}
                />
                {imageError && (
                  <Stack
                    width={imageSize}
                    height={imageSize}
                    backgroundColor="$gray5"
                    borderRadius={4}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text color="$gray11" fontSize="$1">
                      No img
                    </Text>
                  </Stack>
                )}
              </Stack>
            ) : (
              <Stack
                width={imageSize}
                height={imageSize}
                backgroundColor="$gray5"
                borderRadius={4}
                alignItems="center"
                justifyContent="center"
              >
                <Text color="$gray11" fontSize="$1">
                  No img
                </Text>
              </Stack>
            )}
            <YStack flex={1} space={isMobile ? "$0.5" : "$1"}>
              <Text
                color="$color"
                fontSize={titleSize}
                fontWeight="bold"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {song.name}
              </Text>
              <Text
                color="$gray11"
                fontSize={artistSize}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {song.artist}
              </Text>
            </YStack>
          </XStack>
        </Card>
      </Pressable>
    </Animated.View>
  );
}
