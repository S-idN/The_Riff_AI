import { View } from "react-native";
import TamaguiTest from "./TamaguiTest";
import SpotifyLoginButton from "./SpotifyLoginButton";
import { getScreenWidth } from "../getScreenWidth"; // adjust path accordingly
import GitHubLoginButton from "./GithubButton";

const screenWidth = getScreenWidth();
export default function Header() {
  return (
    <View
      style={{ width: screenWidth }}
      className="flex-row justify-between items-center px-4 "
    >
      <GitHubLoginButton />
      <TamaguiTest />
      <SpotifyLoginButton />
    </View>
  );
}
