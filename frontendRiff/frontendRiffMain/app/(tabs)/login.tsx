import { Text, TouchableOpacity, View } from "react-native";
import { Link } from "expo-router";
import "../../global.css";
import { TextInput } from "react-native-gesture-handler";

export default function Index() {
  return (
    <View className="flex-1 justify-center items-center h-svh bg-[#0f0325] text-[#e5d8fc]">
      <View className="flex-1 justify-center items-center text-[#e5d8fc]">
        <Text className="text-[#e5d8fc] font-semibold text-2xl">Login</Text>
        <Text className="text-[#e5d8fc] font-semibold mt-5 mb-1 text-xl">
          Username
        </Text>
        <TextInput className="bg-[#960c2d] p-1 mb-2.5 rounded-lg py-1" />
        <Text className="text-[#e5d8fc] font-semibold mt-2.5 text-xl">
          Password
        </Text>
        <TextInput className="bg-[#960c2d] p-1 mb-5 rounded-lg py-1" />
        <TouchableOpacity className="bg-[#960c2d] rounded-lg py-1 px-1 font-bold">
          {" "}
          Sign Up{" "}
        </TouchableOpacity>
      </View>
    </View>
  );
}
