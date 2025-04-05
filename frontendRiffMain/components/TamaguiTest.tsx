import React from "react";
import { View } from "react-native";
import { Text } from "tamagui";
import Visualiser from "./Visualiser";

const TamaguiTest = () => {
  return (
    <View
      style={{ transform: [{ scale: 2.5 }], marginTop: 40 }}
      className="items-center justify-center"
    >
      <View className="relative">
        {/* White text with 70% opacity */}
        <View className="relative scale-150">
          {/* Gradient Text behind */}
          <Text
            fontFamily="Inter"
            fontSize={48}
            fontWeight="bold"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400"
            opacity={1}
          >
            Riff.ai
          </Text>

          {/* Visualiser (bars in middle layer) */}
          <Visualiser />

          {/* Main white text over top */}
          <Text
            fontFamily="Inter"
            fontSize={48}
            fontWeight="bold"
            opacity={0.9}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white z-10"
          >
            Riff.ai
          </Text>
        </View>
      </View>
    </View>
  );
};

export default TamaguiTest;
