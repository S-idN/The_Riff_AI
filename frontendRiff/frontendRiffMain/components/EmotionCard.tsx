import { YStack, Text, Card, XStack, Button } from "tamagui";

interface EmotionData {
  mood: string;
  emotion: string;
  specific_emotion?: string;
  intent_context_embedding?: number[];
}

interface EmotionCardProps {
  data: EmotionData;
  onRequestSongs: () => void;
  isLoading: boolean;
}

export default function EmotionCard({
  data,
  onRequestSongs,
  isLoading,
}: EmotionCardProps) {
  // Determine mood color
  const getMoodColor = () => {
    switch (data.mood) {
      case "positive":
        return "#4ade80"; // green
      case "negative":
        return "#f87171"; // red
      default:
        return "#93c5fd"; // blue for neutral
    }
  };

  // Determine emotion color
  const getEmotionColor = () => {
    switch (data.emotion) {
      case "joy":
        return "#facc15"; // yellow
      case "sadness":
        return "#60a5fa"; // blue
      case "anger":
        return "#ef4444"; // red
      case "fear":
        return "#a78bfa"; // purple
      case "surprise":
        return "#fb923c"; // orange
      case "disgust":
        return "#84cc16"; // lime
      case "love":
        return "#ec4899"; // pink
      default:
        return "#d1d5db"; // gray for neutral
    }
  };

  // Get specific emotion color
  const getSpecificEmotionColor = () => {
    const specificEmotion = data.specific_emotion || data.emotion;
    switch (specificEmotion) {
      case "joy":
        return "#facc15"; // yellow
      case "sadness":
        return "#60a5fa"; // blue
      case "anger":
        return "#ef4444"; // red
      case "fear":
        return "#a78bfa"; // purple
      case "surprise":
        return "#fb923c"; // orange
      case "disgust":
        return "#84cc16"; // lime
      case "love":
        return "#ec4899"; // pink
      case "calm":
        return "#06b6d4"; // cyan
      case "energetic":
        return "#fb7185"; // rose
      default:
        return "#d1d5db"; // gray for neutral
    }
  };

  // Get description based on mood and emotion
  const getDescription = () => {
    // First check the specific emotion
    const specificEmotion = data.specific_emotion || "";

    if (specificEmotion === "love") {
      return "You're expressing love! Here's some music to match your feelings.";
    } else if (specificEmotion === "energetic") {
      return "You seem energetic! Let's find some music to keep your momentum going.";
    } else if (specificEmotion === "calm") {
      return "You seem calm and relaxed. Here's some music to maintain that vibe.";
    }

    // Fall back to mood-based descriptions
    switch (data.mood) {
      case "positive":
        return "You sound happy! Let's find some upbeat music for you.";
      case "negative":
        return "Sounds like you might need some comforting music.";
      default:
        return "Let's find some music that matches your vibe.";
    }
  };

  return (
    <Card
      width="90%"
      backgroundColor="#1a1a2e"
      padding={16}
      borderRadius={12}
      marginTop={16}
      alignSelf="center"
    >
      <Text color="white" fontSize={18} fontWeight="bold" marginBottom={8}>
        Analysis Results
      </Text>

      <XStack alignItems="center" marginVertical={4}>
        <Text color="white" fontWeight="600" marginRight={8}>
          Mood:
        </Text>
        <Text color={getMoodColor()} fontWeight="500">
          {data.mood.charAt(0).toUpperCase() + data.mood.slice(1)}
        </Text>
      </XStack>

      <XStack alignItems="center" marginVertical={4}>
        <Text color="white" fontWeight="600" marginRight={8}>
          Emotion:
        </Text>
        <Text color={getEmotionColor()} fontWeight="500">
          {data.emotion.charAt(0).toUpperCase() + data.emotion.slice(1)}
        </Text>
      </XStack>

      {data.specific_emotion && data.specific_emotion !== data.emotion && (
        <XStack alignItems="center" marginVertical={4}>
          <Text color="white" fontWeight="600" marginRight={8}>
            Specific:
          </Text>
          <Text color={getSpecificEmotionColor()} fontWeight="500">
            {data.specific_emotion.charAt(0).toUpperCase() +
              data.specific_emotion.slice(1)}
          </Text>
        </XStack>
      )}

      <Text color="#9ca3af" fontSize={14} marginTop={8} marginBottom={12}>
        {getDescription()}
      </Text>

      <Button
        backgroundColor="#4a3b78"
        color="white"
        size="$4"
        marginTop={8}
        borderRadius={8}
        hoverStyle={{ backgroundColor: "#5a4b88" }}
        pressStyle={{ backgroundColor: "#3a2b68" }}
        disabled={isLoading}
        onPress={onRequestSongs}
      >
        {isLoading ? "Finding Songs..." : "Get Song Recommendations"}
      </Button>
    </Card>
  );
}
