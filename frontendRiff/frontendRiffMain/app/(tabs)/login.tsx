import { useState, useEffect } from "react";
import {
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { Linking } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface ErrorResponse {
  username?: string[];
  password1?: string[];
  non_field_errors?: string[];
}

export default function AuthScreen() {
  const [isSignup, setIsSignup] = useState<boolean>(false);
  const [user, setUser] = useState<string>("");
  const [pass1, setPass1] = useState<string>("");
  const [pass2, setPass2] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>("");
  const [rotation] = useState(new Animated.Value(0));
  const [glow, setGlow] = useState<boolean>(false); // Glow state
  const [focusedInput, setFocusedInput] = useState<string | null>(null); // Track which input is focused

  const SPOTIFY_CLIENT_ID = "738024374a41414383cec879914473f6";
  const REDIRECT_URI = "http://localhost:8081/auth-callback";
  const router = useRouter();

  // Handle Spotify login
  const handleSpotifyLogin = () => {
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}&scope=user-read-email user-read-private`;
    Linking.openURL(authUrl);
  };

  // Rotate the gradient background
  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // Interpolate the rotation value
  const rotateInterpolation = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // Handle authentication (signup or login)
  const handleAuth = async () => {
    setLoading(true);
    setErrorMessage("");

    const url = isSignup
      ? "http://127.0.0.1:8000/api/auth/registration/"
      : "http://127.0.0.1:8000/api/auth/login/";

    const payload = isSignup
      ? {
          username: user,
          password1: pass1,
          password2: pass2,
        }
      : { username: user, password: pass1 };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: ErrorResponse = await response.json();

      if (response.ok) {
        console.log(`${isSignup ? "Signup" : "Login"} successful`, data);
        router.push({ pathname: "/", params: { username: user } });
      } else {
        console.error("Auth failed:", data);
        const errorMessages = Object.values(data)
          .flat()
          .filter((msg) => msg)
          .slice(0, 1)
          .join(", ");
        setErrorMessage(errorMessages);
      }
    } catch (error) {
      console.error("Network error:", error);
      setErrorMessage("Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Get the glow style for input fields
  const getInputGlowStyle = (inputName: string) => {
    if (focusedInput === inputName) {
      return {
        shadowOpacity: 0.6, // Reduced opacity for less intense glow
        shadowColor: "rgba(154, 80, 255, 0.6)", // Slightly softer glow color
        shadowRadius: 20, // Reduced shadow radius for subtler glow
        outlineWidth: 0, // Remove the white selection outline
      };
    }
    return {};
  };

  return (
    <LinearGradient
      colors={["#000000", "#02001f", "#000000"]}
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
      }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View className="flex-1 justify-center items-center w-full max-w-lg text-[#e5d8fc]">
        <View
          style={{
            padding: 16,
            backgroundColor: "#130d1a",
            borderRadius: 20,
            borderWidth: 2,
            borderColor: "#9b59b6", // Purple glow color
            shadowOpacity: 0.3,
            marginTop: 50,
            width: "90%",
            maxWidth: 375,
            minWidth: 300,
            position: "relative",
            shadowOffset: { width: 0, height: 0 },
            shadowColor: glow
              ? "rgba(154, 80, 255, 0.6)"
              : "rgba(0, 255, 255, 0.6)",
            shadowRadius: glow ? 20 : 12, // Reduced shadow intensity
          }}
        >
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 20,
              zIndex: -1,
              backgroundImage: `linear-gradient(${rotateInterpolation}, #9b59b6, #8e44ad)`, // Animated gradient
            }}
          />
          <Text className="text-[#e5d8fc] font-semibold text-3xl sm:text-2xl text-center">
            {isSignup ? "Sign Up" : "Login"}
          </Text>

          <Text className="text-[#e5d8fc] self-center font-semibold mt-5 mb-3 text-xl">
            Username
          </Text>
          <TextInput
            onChangeText={setUser}
            onFocus={() => setFocusedInput("username")}
            onBlur={() => setFocusedInput(null)}
            className="bg-[#1a013f] p-2 mb-2.5 rounded-lg text-white shadow-inner"
            value={user}
            placeholder="Enter your username"
            placeholderTextColor="#ccc"
            style={getInputGlowStyle("username")}
          />

          <Text className="text-[#e5d8fc] self-center font-semibold mt-2.5 mb-3 text-xl">
            Password
          </Text>
          <TextInput
            secureTextEntry
            onChangeText={setPass1}
            onFocus={() => setFocusedInput("password1")}
            onBlur={() => setFocusedInput(null)}
            className="bg-[#1a013f] p-2 mb-5 rounded-lg text-white shadow-inner"
            value={pass1}
            placeholder="Enter your password"
            placeholderTextColor="#ccc"
            style={getInputGlowStyle("password1")}
          />

          {isSignup && (
            <>
              <Text className="text-[#e5d8fc] self-center font-semibold mt-2.5 text-xl">
                Confirm Password
              </Text>
              <TextInput
                secureTextEntry
                onChangeText={setPass2}
                onFocus={() => setFocusedInput("password2")}
                onBlur={() => setFocusedInput(null)}
                className="bg-[#1a013f] p-2 mb-5 rounded-lg text-white shadow-inner"
                value={pass2}
                placeholder="Confirm your password"
                placeholderTextColor="#ccc"
                style={getInputGlowStyle("password2")}
              />
            </>
          )}

          <TouchableOpacity
            onPress={() => {
              setGlow(true);
              handleAuth();
            }}
            onPressIn={() => setGlow(true)} // Trigger glow increase
            onPressOut={() => setGlow(false)} // Revert glow on button release
            disabled={loading}
            className="bg-[#360087] self-center rounded-lg py-2 px-4 font-bold mb-2"
          >
            <Text className="text-[#e5d8fc] font-semibold text-lg sm:text-xl">
              {loading ? "Loading..." : isSignup ? "Sign Up" : "Login"}
            </Text>
          </TouchableOpacity>

          {errorMessage && (
            <Text className="text-[#a4170a] font-semibold text-md mt-4 text-center">
              {errorMessage}
            </Text>
          )}

          <TouchableOpacity onPress={handleSpotifyLogin} className="mt-4">
            <Text className="text-[#e5d8fc] bg-[#191414] px-2 py-1 rounded-lg self-center font-semibold text-lg">
              Login with Spotify
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsSignup(!isSignup)}
            className="mt-4"
          >
            <Text className="text-[#e5d8fc] self-center text-md">
              {isSignup
                ? "Already have an account? Login"
                : "Create an account"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}
