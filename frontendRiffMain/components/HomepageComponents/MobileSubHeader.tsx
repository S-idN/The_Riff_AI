import React from "react";
import { View, Text, XStack, YStack, Image } from "tamagui";
import SpotifyLoginButton from "./SpotifyLoginButton";
import GitHubLoginButton from "./GithubButton";

const MobileSubHeader = () => {
  return (
    <View
      style={{ transform: [{ scale: 1.15 }] }}
      paddingTop={40}
      marginTop={0}
    >
      {/* Centered Section */}
      <View width="100%" alignItems="center" paddingBottom={0} paddingTop={0}>
        <XStack
          space="$6"
          alignItems="center"
          justifyContent="center"
          flexWrap="wrap"
          maxWidth={960}
        >
          {/* Text Block */}
          <YStack padding="$4" space="$2" maxWidth={360}>
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
              marginTop="15px"
            >
              Riff AI uses AI to dynamically create playlists, tailored just for
              you. Feeling down? Or maybe you're about to go for a long drive.
              Regardless of the situation, just click generate playlist and let
              Riff AI do the work for you.
            </Text>

            <Text
              fontSize={18}
              fontWeight="600"
              textAlign="center"
              color="$gray10"
              marginTop="$2"
            >
              Login using your Spotify account to start creating!
            </Text>
          </YStack>
        </XStack>
      </View>
      <View marginTop="$2" style={{ transform: [{ scale: 0.95 }] }}>
        <SpotifyLoginButton />
      </View>

      <View marginTop="$6" style={{ transform: [{ scale: 0.95 }] }}>
        <GitHubLoginButton />
      </View>
    </View>
  );
};

export default MobileSubHeader;
