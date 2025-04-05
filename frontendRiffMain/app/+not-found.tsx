import React, { useState } from "react";
import { Text, View, Pressable, Platform, Animated } from "react-native";
import { Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, Paragraph, useTheme, isWeb } from "tamagui";
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import "../global.css";

export default function About() {
  const [isPressed, setIsPressed] = useState(false);
  const theme = useTheme();

  const darkGradientColors: [string, string] = ["#191414", "#0f0c0c"];
  const spotifyGreenGradient: [string, string] = ["#2cb15b", "#1DB954"];
  const darkTextColor = "#141414";

  // Animation values for hover effect
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(50);
  const translateY = useSharedValue(50);

  // Hover logic (Web Only)
  const handleHoverIn = () => {
    opacity.value = withTiming(1, { duration: 300 });
    translateX.value = withTiming(0, { duration: 300 });
    translateY.value = withTiming(0, { duration: 300 });
  };

  const handleHoverOut = () => {
    opacity.value = withTiming(0, { duration: 300 });
    translateX.value = withTiming(50, { duration: 300 });
    translateY.value = withTiming(50, { duration: 300 });
  };

  // Animate the hover effect as an overlay
  const animatedOverlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const handleButtonPress = () => {
    console.log("Spotify button pressed on About page.");
  };

  return (
    <View className="flex-1 justify-center items-center h-screen bg-[#0f0325] text-[#e5d8fc] space-y-6 p-4">
      <Text className="text-[#960c2d] font-bold text-3xl text-center">
        You shouldn't be here
      </Text>

      <Link className="text-[#e5d8fc] text-lg underline" href="/">
        Click here to go Home
      </Link>

      {/* Web-only hover wrapper using div */}
      {isWeb ? (
        <div
          onMouseEnter={handleHoverIn}
          onMouseLeave={handleHoverOut}
          className="rounded-lg overflow-hidden relative"
        >
          <Pressable
            onPress={handleButtonPress}
            onPressIn={() => setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
            className="rounded-lg overflow-hidden shadow-lg relative"
          >
            {/* Default dark background */}
            <LinearGradient
              colors={darkGradientColors}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              className="absolute w-full h-full"
            />

            {/* Animated hover effect overlay */}
            <Animated.View
              style={[
                animatedOverlayStyle,
                {
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                },
              ]}
            >
              <LinearGradient
                colors={spotifyGreenGradient}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 0 }}
                className="absolute w-full h-full"
              />
            </Animated.View>

            <View className="px-6 py-3 flex items-center justify-center relative">
              <Paragraph
                color={darkTextColor}
                fontWeight="bold"
                fontSize="$6"
                letterSpacing={0.5}
              >
                Login with Spotify
              </Paragraph>
            </View>
          </Pressable>
        </div>
      ) : (
        <Pressable
          onPress={handleButtonPress}
          onPressIn={() => setIsPressed(true)}
          onPressOut={() => setIsPressed(false)}
          className="rounded-lg overflow-hidden shadow-lg"
        >
          <LinearGradient
            colors={isPressed ? spotifyGreenGradient : darkGradientColors}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            className="px-6 py-3 flex items-center justify-center"
          >
            <Paragraph
              color={isPressed ? darkTextColor : "#2cb15b"}
              fontWeight="bold"
              fontSize="$6"
              letterSpacing={0.5}
            >
              Login with Spotify
            </Paragraph>
          </LinearGradient>
        </Pressable>
      )}
    </View>
  );
}
