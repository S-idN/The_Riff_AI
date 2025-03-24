import { Text, View } from "react-native";
import { Link } from "expo-router";
import "../global.css";

export default function About() {
  return (
    <View className="flex-1 justify-center items-center h-svh bg-[#0f0325] text-[#e5d8fc]">
      <Text className="text-[#960c2d] font-bold text-3xl">
        You shouldn't be here
      </Text>
      <Link className="text-[#e5d8fc]" href={"/"}>
        Click here to go Home
      </Link>
    </View>
  );
}
