import React from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
} from "react-native-reanimated";

type RecordVoiceButtonProps = {
  isRecording: boolean;
  isAnalyzing: boolean;
  startRecording: () => void;
  stopRecording: () => void;
};

const RecordVoiceButton: React.FC<RecordVoiceButtonProps> = ({
  isRecording,
  isAnalyzing,
  startRecording,
  stopRecording,
}) => {
  const hover = useSharedValue(0);

  const gesture = Gesture.Hover()
    .onBegin(() => (hover.value = withTiming(1, { duration: 300 })))
    .onEnd(() => (hover.value = withTiming(0, { duration: 300 })));

  const gradientOverlay = useAnimatedStyle(() => ({
    opacity: hover.value,
  }));

  const blackText = useAnimatedStyle(() => ({
    opacity: hover.value,
  }));

  const handlePress = () => {
    if (isAnalyzing) return;
    isRecording ? stopRecording() : startRecording();
  };

  const buttonText = isAnalyzing
    ? "Analyzing..."
    : isRecording
    ? "Stop Recording"
    : "Record Voice";

  return (
    <View className="flex-1 mb-5">
      <GestureDetector gesture={gesture}>
        <Pressable
          onPress={handlePress}
          disabled={isAnalyzing}
          className="rounded-xl overflow-hidden shadow-md"
          style={{ opacity: isAnalyzing ? 0.7 : 1 }}
        >
          <LinearGradient
            colors={["#0D1117", "#0D1127"]}
            className="rounded-xl px-6 py-4 items-center justify-center relative"
          >
            {/* Hover overlay */}
            <Animated.View
              style={[StyleSheet.absoluteFillObject, gradientOverlay]}
              className="rounded-xl"
            >
              <LinearGradient
                colors={["#a78bfa", "#c084fc"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="w-full h-full rounded-xl"
              />
            </Animated.View>

            {/* Button Text */}
            <View className="relative">
              {/* Gradient text below */}
              <Text
                className="text-lg font-bold text-transparent"
                style={{
                  backgroundClip: "text",
                  backgroundImage:
                    "linear-gradient(to right, #c084fc, #a78bfa)",
                }}
              >
                {buttonText}
              </Text>

              {/* Black hover text above */}
              <Animated.Text
                style={[blackText, { position: "absolute", top: 0, left: 0 }]}
                className="text-lg font-bold text-black"
              >
                {buttonText}
              </Animated.Text>
            </View>
          </LinearGradient>
        </Pressable>
      </GestureDetector>
    </View>
  );
};

export default RecordVoiceButton;
