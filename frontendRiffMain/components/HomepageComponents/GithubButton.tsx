import React from "react";
import {
  Pressable,
  Text,
  View,
  Image,
  StyleSheet,
  Linking,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
} from "react-native-reanimated";

const GitHubLogo = require("../../assets/Github-Logo.png");

const handleGitHubRedirect = () => {
  const url = "https://github.com/S-idN/The_Riff_AI/tree/temp_fix";
  Linking.openURL(url);
};

const GitHubLoginButton = () => {
  const hover = useSharedValue(0);
  const gesture = Gesture.Hover()
    .onBegin(() => (hover.value = withTiming(1, { duration: 300 })))
    .onEnd(() => (hover.value = withTiming(0, { duration: 300 })));

  const gradientOverlay = useAnimatedStyle(() => ({ opacity: hover.value }));
  const blackText = useAnimatedStyle(() => ({
    opacity: hover.value,
  }));

  return (
    <View className="flex-0 mb-5">
      <GestureDetector gesture={gesture}>
        <Pressable
          onPress={handleGitHubRedirect}
          className="rounded-xl overflow-hidden shadow-md"
        >
          <LinearGradient
            colors={["#0D1117", "#161B22"]}
            className="rounded-xl px-6 py-3 items-center justify-center relative"
          >
            {/* Hover overlay */}
            <Animated.View
              style={[StyleSheet.absoluteFillObject, gradientOverlay]}
              className="rounded-xl"
            >
              <LinearGradient
                colors={["#a78bfa", "#60a5fa"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="w-full h-full rounded-xl"
              />
            </Animated.View>

            {/* GitHub logo */}
            <Image
              source={GitHubLogo}
              style={{
                width: 32,
                height: 32,
                marginBottom: 8,
                resizeMode: "contain",
              }}
            />

            {/* Button text */}
            <View className="relative">
              <Text className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                See our code
              </Text>
              <Animated.Text
                style={blackText}
                className="absolute top-0 left-0 text-lg font-bold text-black"
              >
                See our code
              </Animated.Text>
            </View>
          </LinearGradient>
        </Pressable>
      </GestureDetector>
    </View>
  );
};

export default GitHubLoginButton;
