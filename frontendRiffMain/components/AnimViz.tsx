import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Easing } from "react-native";

const AnimViz = ({ isListening = true, size = 250, color = "#007AFF" }) => {
  // Create animated values for each wave circle
  const animatedValues = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    // Function to animate each circle with different timing
    const animateCircles = () => {
      // Reset all animations
      animatedValues.forEach((anim) => anim.setValue(0));

      // Create animations with different durations and delays
      const animations = animatedValues.map((anim, index) => {
        return Animated.timing(anim, {
          toValue: 1,
          duration: 1800 + index * 200, // Different duration for each circle
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        });
      });

      // Start all animations in sequence
      Animated.stagger(150, animations).start(() => {
        if (isListening) {
          animateCircles(); // Loop while listening
        }
      });
    };

    if (isListening) {
      animateCircles();
    } else {
      // Reset animations when not listening
      animatedValues.forEach((anim) => anim.setValue(0));
    }

    return () => {
      // Cleanup
      animatedValues.forEach((anim) => anim.stopAnimation());
    };
  }, [isListening]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {animatedValues.map((anim, index) => {
        const circleSize = size - index * (size / 10);

        // Scale and opacity animations
        const scale = anim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.8, 1, 0.8],
        });

        const opacity = anim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.3, 0.7, 0.3],
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.circle,
              {
                width: circleSize,
                height: circleSize,
                borderRadius: circleSize / 2,
                backgroundColor: color,
                transform: [{ scale }],
                opacity,
                position: "absolute",
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  circle: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export default AnimViz;
