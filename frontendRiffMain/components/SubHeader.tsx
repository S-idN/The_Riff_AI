import React from "react";
import { View, Text, XStack, Image } from "tamagui";

const SubHeader = () => {
  return (
    <View style={{ transform: [{ scale: 1.15 }] }}>
      <View
        flexDirection="row"
        backgroundColor="#0E0B1F"
        width="100%"
        alignItems="center"
        paddingHorizontal="$6"
      >
        {/* Left Half */}
        <XStack
          width="200%"
          padding="$4"
          maxWidth={480}
          space="$4"
          justifyContent="flex-start" // Aligns everything to the left horizontally
          alignItems="center" // Vertically centers children within this stack
          borderRadius={100}
        >
          <Text
            fontSize={48}
            fontWeight="800"
            color="white"
            lineHeight={36}
            minWidth={175}
          >
            What is Riff AI?
          </Text>

          <Text
            fontSize={18}
            lineHeight={28}
            color="$gray10"
            textAlign="justify"
            maxWidth={360}
          >
            Riff AI uses AI to dynamically create playlists, tailored just for
            you. Feeling down? Or maybe you're about to go for a long drive.
            Regardless of the situation, just click generate playlist and let
            Riff AI do the work for you.
          </Text>
        </XStack>

        {/* Right Half with image */}
        <View width="50%">
          <XStack
            width="200%"
            padding="$4"
            maxWidth={480}
            space="$4"
            borderRadius={100}
          >
            <Image
              source={require("../assets/200w.gif")}
              width={200}
              height={200}
              borderRadius={16}
              alt="Riff AI Preview"
            />
          </XStack>
        </View>
      </View>
    </View>
  );
};

export default SubHeader;
