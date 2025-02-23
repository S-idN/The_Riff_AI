import { useState } from "react";
import { Text, TouchableOpacity, View, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { Linking } from "react-native";
import "../../global.css";

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
  const [loading, setLoading] = useState<boolean>(false); // Loading state
  const [errorMessage, setErrorMessage] = useState<string | null>(""); // Type declaration for errorMessage
  const SPOTIFY_CLIENT_ID = "738024374a41414383cec879914473f6";
  const REDIRECT_URI = "http://localhost:8081/auth-callback";
  const router = useRouter();

  const handleSpotifyLogin = () => {
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}&scope=user-read-email user-read-private`;
    Linking.openURL(authUrl);
  };

  const handleAuth = async () => {
    setLoading(true);
    setErrorMessage(""); // Clear error message before trying

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

        // Extract the first error message from each field if multiple errors exist
        const errorMessages = Object.values(data)
          .flat() // Flatten the arrays of errors
          .filter((msg) => msg) // Remove any undefined/null values
          .slice(0, 1) // Only keep the first error message (if multiple errors exist)
          .join(", "); // Join them into one string (although we are keeping just one error here)

        setErrorMessage(errorMessages); // Set error message to be displayed
      }
    } catch (error) {
      console.error("Network error:", error);
      setErrorMessage("Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center items-center h-svh bg-[#0f0325] text-[#e5d8fc]">
      <View className="flex-1 justify-center items-center text-[#e5d8fc]">
        <Text className="text-[#e5d8fc] font-semibold text-2xl">
          {isSignup ? "Sign Up" : "Login"}
        </Text>

        <Text className="text-[#e5d8fc] font-semibold mt-5 mb-1 text-xl">
          Username
        </Text>
        <TextInput
          onChangeText={setUser}
          className="bg-[#960c2d] p-1 mb-2.5 rounded-lg py-1"
          value={user}
        />

        <Text className="text-[#e5d8fc] font-semibold mt-2.5 text-xl">
          Password
        </Text>
        <TextInput
          secureTextEntry
          onChangeText={setPass1}
          className="bg-[#960c2d] p-1 mb-5 rounded-lg py-1"
          value={pass1}
        />

        {isSignup && (
          <>
            <Text className="text-[#e5d8fc] font-semibold mt-2.5 text-xl">
              Confirm Password
            </Text>
            <TextInput
              secureTextEntry
              onChangeText={setPass2}
              className="bg-[#960c2d] p-1 mb-5 rounded-lg py-1"
              value={pass2}
            />
          </>
        )}

        <TouchableOpacity
          onPress={handleAuth}
          disabled={loading}
          className="bg-[#960c2d] rounded-lg py-1 px-1 font-bold mb-2"
        >
          <Text className="text-[#e5d8fc] font-semibold text-xl">
            {loading ? "Loading..." : isSignup ? "Sign Up" : "Login"}
          </Text>
        </TouchableOpacity>

        {/* Display error message if there is one */}
        {errorMessage && (
          <Text className="text-[#ff0000] font-semibold text-lg mt-4">
            {errorMessage}
          </Text>
        )}

        <TouchableOpacity
          onPress={() => setIsSignup(!isSignup)}
          className="mt-4"
        >
          <Text className="text-[#e5d8fc] font-semibold text-lg">
            {isSignup ? "Already have an account? Login" : "Create an account"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSpotifyLogin} className="mt-4">
          <Text className="text-[#1DB954] font-semibold text-lg">
            Login with Spotify 🎵
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
