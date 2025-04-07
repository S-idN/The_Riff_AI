import React from "react";
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  GestureResponderEvent,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
} from "react-native-reanimated";

type AnalyzeTextButtonProps = {
  onPress: (event: GestureResponderEvent) => void;
  disabled: boolean;
  isAnalyzing: boolean;
};

const AnalyzeTextButton: React.FC<AnalyzeTextButtonProps> = ({
  onPress,
  disabled,
  isAnalyzing,
}) => {
  const hover = useSharedValue(0);

  const gesture = Gesture.Hover()
    .onBegin(() => (hover.value = withTiming(1, { duration: 300 })))
    .onEnd(() => (hover.value = withTiming(0, { duration: 300 })));

  const gradientOverlay = useAnimatedStyle(() => ({ opacity: hover.value }));
  const blackText = useAnimatedStyle(() => ({ opacity: hover.value }));

  return (
    <View className="flex-1 mb-5">
      <GestureDetector gesture={gesture}>
        <Pressable
          onPress={onPress}
          disabled={disabled}
          className="rounded-xl overflow-hidden shadow-md"
          style={{ opacity: disabled ? 0.7 : 1 }}
        >
          <LinearGradient
            colors={["#0D1117", "#0D1127"]}
            className="rounded-xl px-6 py-3 items-center justify-center relative"
          >
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

            <View className="relative">
              <Text className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                {isAnalyzing ? "Analyzing..." : "Analyze Text"}
              </Text>
              <Animated.Text
                style={blackText}
                className="absolute top-0 left-0 text-lg font-bold text-black"
              >
                {isAnalyzing ? "Analyzing..." : "Analyze Text"}
              </Animated.Text>
            </View>
          </LinearGradient>
        </Pressable>
      </GestureDetector>
    </View>
  );
};

export default AnalyzeTextButton;
