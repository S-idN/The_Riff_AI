import React, { useEffect, useRef } from "react";
import { View } from "react-native";
import Svg, { Rect, Defs, LinearGradient, Stop } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from "react-native-reanimated";

const waveformSets = [
  [
    33, 25, 30, 25, 16, 13, 19, 13, 21, 17, 10, 18, 28, 31, 28, 22, 16, 10, 10,
    10,
  ],
  [
    15, 22, 18, 10, 30, 24, 11, 15, 18, 21, 17, 25, 29, 23, 16, 10, 10, 10, 12,
    14,
  ],
  [
    20, 25, 18, 24, 15, 20, 25, 30, 22, 17, 14, 10, 15, 20, 25, 30, 26, 20, 16,
    10,
  ],
];

const AnimatedRect = Animated.createAnimatedComponent(Rect);

const BarWaveform = () => {
  const bars = useRef(waveformSets[0].map((v) => useSharedValue(v))).current;
  const indexRef = useRef(0);

  useEffect(() => {
    const loopAnimation = () => {
      const nextIndex = (indexRef.current + 1) % waveformSets.length;
      const nextSet = waveformSets[nextIndex];

      nextSet.forEach((val, i) => {
        bars[i].value = withTiming(val, {
          duration: 400,
          easing: Easing.inOut(Easing.ease),
        });
      });

      indexRef.current = nextIndex;

      // Schedule next loop immediately after current
      setTimeout(loopAnimation, 400);
    };

    loopAnimation(); // Start looping
  }, []);

  return (
    <View className="items-center mt-6">
      <Svg height="80" width={bars.length * 6}>
        <Defs>
          <LinearGradient id="waveGradient" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#a78bfa" />
            <Stop offset="1" stopColor="#60a5fa" />
          </LinearGradient>
        </Defs>

        {bars.map((bar, i) => {
          const animatedProps = useAnimatedProps(() => ({
            height: bar.value,
            y: 40 - bar.value,
          }));

          return (
            <AnimatedRect
              key={i}
              x={i * 8 + 8} // was 6 before — increase spacing between bars
              width={5} // was 4 — increase bar width too (optional)
              rx={2}
              fill="url(#waveGradient)"
              animatedProps={animatedProps}
            />
          );
        })}
      </Svg>
    </View>
  );
};

export default BarWaveform;
