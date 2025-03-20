import { Button, Text, YStack } from "tamagui";

export default function TamaguiTest() {
  return (
    <YStack
      padding={16}
      margin={8}
      backgroundColor="$background"
      borderRadius={8}
      alignItems="center"
      width="90%"
      alignSelf="center"
    >
      <Text color="$color" fontSize={20} fontWeight="bold">
        Tamagui in Riff.AI! 🎵
      </Text>
      <Text color="$color" fontSize={14} marginTop={4} textAlign="center">
        You can now use Tamagui components for your music app's UI
      </Text>
      <Button
        marginTop={16}
        backgroundColor="#4a3b78"
        color="white"
        size="$4"
        hoverStyle={{ backgroundColor: "#5a4b88" }}
        pressStyle={{ backgroundColor: "#3a2b68" }}
        borderRadius={8}
        paddingHorizontal={16}
        onPress={() => alert("Tamagui button pressed!")}
      >
        Tamagui Button
      </Button>
    </YStack>
  );
}
