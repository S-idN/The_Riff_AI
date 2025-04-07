import React from "react";
import { View, Text, XStack, YStack, Image } from "tamagui";

const SubHeader = () => {
  return (
    <View style={{ transform: [{ scale: 1.15 }] }}>
      {/* Centered Section */}
      <View width="100%" alignItems="center" paddingBottom="$3">
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
          </YStack>

          {/* Image */}
          <Image
            source={require("../../assets/200w.gif")}
            width={350}
            height={350}
            borderRadius={16}
            alt="Riff AI Preview"
          />
        </XStack>
      </View>

      {/* Bottom Three Boxes (written out explicitly) */}
      <XStack
        space="$4"
        paddingHorizontal="$6"
        justifyContent="space-between"
        marginTop="$2" // reduced from $4 to $2
        width="100%"
      >
        {/* Box 1 */}
        <YStack
          flex={1}
          backgroundColor="#1C1A2E"
          padding="$4"
          borderRadius={16}
          alignItems="center"
          space="$2"
        >
          <Text fontSize={20} fontWeight="700" color="white" textAlign="center">
            How do we create the playlists?
          </Text>
          <Text
            fontSize={16}
            color="$gray10"
            textAlign="justify"
            maxWidth={200}
          >
            We used a combination of BERT models and our own Context-based-song
            recommendations model to decide what songs to add.
          </Text>
        </YStack>

        {/* Box 2 */}
        <YStack
          flex={1}
          backgroundColor="#1C1A2E"
          padding="$4"
          borderRadius={16}
          alignItems="center"
          space="$2"
        >
          <Text fontSize={20} fontWeight="700" color="white" textAlign="center">
            How can I start making playlists?
          </Text>
          <Text
            fontSize={16}
            color="$gray10"
            textAlign="justify"
            maxWidth={200}
          >
            Login to your Spotify account, give us a text or audio input and
            you're good to go! The playlist will be made in your account.
          </Text>
        </YStack>

        {/* Box 3 */}
        <YStack
          flex={1}
          backgroundColor="#1C1A2E"
          padding="$4"
          borderRadius={16}
          alignItems="center"
          space="$2"
        >
          <Text fontSize={20} fontWeight="700" color="white" textAlign="center">
            What did we use?
          </Text>
          <Text
            fontSize={16}
            color="$gray10"
            textAlign="justify"
            maxWidth={300}
          >
            We used a combination of BERT models and our own Context-based-song
            recommendations model to decide what songs to add. This information
            is fed to the Spotify webAPI from where the playlist is added to
            your account!
          </Text>
        </YStack>
      </XStack>
    </View>
  );
};

export default SubHeader;
