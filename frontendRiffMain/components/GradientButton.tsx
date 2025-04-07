// components/GradientButton.tsx
import { TouchableOpacity, Text } from "react-native";

type GradientButtonProps = {
  onPress: () => void;
  loading?: boolean;
  text?: string;
  loadingText?: string;
  disabled?: boolean;
};

export default function GradientButton({
  onPress,
  loading = false,
  text = "Submit",
  loadingText = "Loading...",
  disabled = false,
}: GradientButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className="mt-6 bg-gradient-to-r from-purple-600 to-blue-600 p-4 rounded-2xl shadow-lg transition-all duration-300 active:scale-95 border border-white/10"
      style={{ opacity: disabled || loading ? 0.7 : 1 }}
    >
      <Text className="text-white font-bold text-lg text-center">
        {loading ? loadingText : text}
      </Text>
    </TouchableOpacity>
  );
}
