import { Text, View } from "react-native";
import { Link } from "expo-router";
import "../../global.css";

export default function About() {
  return (
    <View className="flex-1 justify-center items-center h-svh bg-[#0f0325] text-[#e5d8fc]">
      <Text className="text-[#e5d8fc] font-semibold">This was a mistake</Text>
      <Link className="text-[#e5d8fc]" href={"/"}>
        Never Link this
      </Link>
    </View>
  );
}
