import { Text, View } from "react-native";
import { Link } from "expo-router";
import "../../global.css";

export default function Index() {
  return (
    <View className="flex-1 justify-center items-center h-svh bg-[#0f0325] text-[#e5d8fc]">
      <Text className="text-[#e5d8fc] font-semibold">
        Riff.AI (fr this time)
      </Text>
      <Link className="text-[#e5d8fc]" href={"/about"}>
        Go to About Screen
      </Link>
    </View>
  );
}
