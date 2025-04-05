import React, { useEffect } from "react";
import { View, Image, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

const IMAGES = [
  require("../assets/image1.jpg"),
  require("../assets/image2.jpg"),
  require("../assets/image3.jpg"),
];

const AutoCarousel = () => {
  const currentIndex = useSharedValue(0);

  useEffect(() => {
    const interval = setInterval(() => {
      currentIndex.value = (currentIndex.value + 1) % IMAGES.length;
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withTiming(-currentIndex.value * width, { duration: 500 }),
      },
    ],
  }));

  return (
    <View className="w-full h-60 overflow-hidden">
      <Animated.View
        style={[
          { flexDirection: "row", width: width * IMAGES.length },
          animatedStyle,
        ]}
      >
        {IMAGES.map((img, index) => (
          <Image
            key={index}
            source={img}
            style={{ width, height: "100%" }}
            resizeMode="cover"
          />
        ))}
      </Animated.View>
    </View>
  );
};

export default AutoCarousel;
