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
import MaskedView from "@react-native-masked-view/masked-view";
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
} from "react-native-reanimated";

const SpotifyLogo = require("../../assets/Spotify-Logo.png");
const CLIENT_ID = "738024374a41414383cec879914473f6";
const REDIRECT_URI = "http://localhost:8081/auth-callback";

const handleLogin = () => {
  const url = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&scope=user-read-email user-read-private playlist-modify-public playlist-modify-private`;
  Linking.openURL(url);
};

const SpotifyLoginButton = () => {
  const hover = useSharedValue(0);
  const gesture = Gesture.Hover()
    .onBegin(() => (hover.value = withTiming(1, { duration: 300 })))
    .onEnd(() => (hover.value = withTiming(0, { duration: 300 })));

  const gradientOverlay = useAnimatedStyle(() => ({ opacity: hover.value }));
  const blackText = useAnimatedStyle(() => ({
    opacity: hover.value, // 0 = fully gradient, 1 = fully black
  }));

  return (
    <View className="flex-0 mb-5">
      <GestureDetector gesture={gesture}>
        <Pressable
          onPress={handleLogin}
          className="rounded-xl overflow-hidden shadow-md"
        >
          {/* Background gradient */}
          <LinearGradient
            colors={["#191414", "#121212"]}
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

            {/* Spotify logo */}
            <Image
              source={SpotifyLogo}
              style={{
                width: 32,
                height: 32,
                marginBottom: 8,
                resizeMode: "contain",
              }}
            />

            {/* Button text: gradient → black on hover */}
            <View className="relative">
              <Text className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                Login with Spotify
              </Text>
              <Animated.Text
                style={blackText}
                className="absolute top-0 left-0 text-lg font-bold text-black"
              >
                Login with Spotify
              </Animated.Text>
            </View>
          </LinearGradient>
        </Pressable>
      </GestureDetector>
    </View>
  );
};

export default SpotifyLoginButton;
