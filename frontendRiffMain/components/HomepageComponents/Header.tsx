import { View, Platform } from "react-native";
import TamaguiTest from "./TamaguiTest";
import SpotifyLoginButton from "./SpotifyLoginButton";
import GitHubLoginButton from "./GithubButton";
import { getScreenWidth } from "../getScreenWidth";

const screenWidth = getScreenWidth();

export default function Header() {
  return (
    <View
      style={{
        width: screenWidth,
        height: 60,
        position: "relative",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
      }}
    >
      {/* Left - GitHub Button */}
      <View style={{ position: "absolute", left: 16 }}>
        <GitHubLoginButton />
      </View>

      {/* Center - Logo */}
      <View
        style={{
          position: "absolute",
          left: "50%",
          transform: [{ translateX: -50 }],
        }}
      >
        <TamaguiTest />
      </View>

      {/* Right - Spotify Button */}
      <View style={{ position: "absolute", right: 16 }}>
        <SpotifyLoginButton />
      </View>
    </View>
  );
}
