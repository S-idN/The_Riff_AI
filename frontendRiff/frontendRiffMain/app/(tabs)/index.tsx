import { useEffect, useState } from "react";
import {
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
  TextInput,
  Dimensions,
  Animated,
  Linking,
} from "react-native";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import TypeWriter from "react-native-typewriter";
import { RFPercentage } from "react-native-responsive-fontsize";
import { MaterialIcons } from "@expo/vector-icons";
import "../../global.css";
import Storage from "./storage";

export default function Index() {
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { display_name: paramsDisplayName, username: paramsUsername } =
    useLocalSearchParams<{ display_name?: string; username?: string }>();
  const [token, setToken] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [inputValue, setInputValue] = useState("");
  const [underscoreVisible, setUnderscoreVisible] = useState(true);
  const [weather, setWeather] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const placeholderText = "What are you in the mood for ?";
  const screenWidth = Dimensions.get("window").width;
  const isDesktop = screenWidth > 1200;
  const inputWidth = isDesktop
    ? screenWidth * 0.4
    : Math.min(screenWidth * 0.8, 450);

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

  useEffect(() => {
    const loadTokenAndFetchProfile = async () => {
      try {
        const storedToken = await Storage.getItem("access_token");
        if (storedToken) {
          setToken(storedToken);
        } else {
          setLoading(false);
          return;
        }

        // Fetch profile after setting token
        try {
          const response = await fetch(
            "http://localhost:8000/api/auth/profile/",
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${storedToken}`, // Use storedToken instead of token
                "Content-Type": "application/json",
              },
              credentials: "include",
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }

          const data = await response.json();
          setUsername(data.display_name || data.id);
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
        }
      } catch (error) {
        console.error("Failed to load token:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTokenAndFetchProfile();
  }, []);

  useEffect(() => {
    if (username) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [username]);

  useEffect(() => {
    const interval = setInterval(() => {
      setUnderscoreVisible((prev) => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:8000/api/auth/logout/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
    } catch (error) {
      console.error("Error logging out:", error);
    }

    await Storage.removeItem("access_token");
    setUsername(null);
    setToken(null);
    setMenuVisible(false);

    window.history.replaceState(null, "", "/");
    window.location.reload();
  };

  useEffect(() => {
    console.log("Updated weather state:", weather);
  }, [weather]);

  // Function to fetch weather data - Fixed endpoint URL
  const recVoice = async () => {};

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
      {!username && (
        <TouchableOpacity
          onPress={handleSpotifyLogin}
          className="absolute top-4 right-4 bg-[#191414] rounded-lg px-4 py-2"
        >
          <Text
            style={{
              fontSize: RFPercentage(0.9), // Responsive font size
              color: "#e5d8fc",
              textAlign: "center",
              fontFamily: "sans-serif",
            }}
          >
            Login with Spotify
          </Text>
        </TouchableOpacity>
      )}

      {username && (
        <View style={{ position: "absolute", top: 20, right: 20 }}>
          <TouchableWithoutFeedback
            onPress={() => setMenuVisible(!menuVisible)}
          >
            <MaterialIcons name="account-circle" size={60} color="#e5d8fc" />
          </TouchableWithoutFeedback>
          {menuVisible && (
            <View className="absolute top-[3.5rem] right-0 bg-[#1a1a2e] p-2 rounded-lg shadow-lg border border-gray-600">
              <TouchableOpacity className="p-2">
                <Text className="text-white">Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity className="p-2">
                <Text className="text-white">Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout} className="p-2">
                <Text className="text-red-800 font-bold">Logout</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#e5d8fc" />
      ) : (
        <>
          <View
            style={{
              alignItems: "center",
              transform: [{ scale: isDesktop ? 0.8 : 1 }],
            }}
          >
            <View style={{ alignItems: "center" }}>
              <View style={{ alignItems: "center", flexDirection: "row" }}>
                {username ? (
                  <Text
                    style={{
                      fontSize: RFPercentage(3.5),
                      color: "#e5d8fc",
                      fontWeight: "bold",
                      textAlign: "center",
                      fontFamily: "sans-serif",
                    }}
                  >
                    Welcome ,
                  </Text>
                ) : (
                  <Text
                    style={{
                      fontSize: RFPercentage(3.5),
                      color: "#e5d8fc",
                      fontWeight: "bold",
                      textAlign: "center",
                      fontFamily: "sans-serif",
                    }}
                  >
                    <TypeWriter typing={1} maxDelay={100}>
                      Riff.AI
                    </TypeWriter>
                    <Text
                      style={{
                        opacity: underscoreVisible ? 1 : 0,
                        fontSize: RFPercentage(2),
                        color: "#e5d8fc",
                      }}
                    >
                      _
                    </Text>
                  </Text>
                )}
              </View>
              {username && (
                <Text
                  className="mt-2"
                  style={{
                    fontSize: RFPercentage(3.5),
                    color: "#e5d8fc",
                    fontWeight: "bold",
                    textAlign: "center",
                    fontFamily: "sans-serif",
                  }}
                >
                  <TypeWriter typing={1} maxDelay={100}>
                    {username}
                  </TypeWriter>
                  <Text
                    style={{
                      opacity: underscoreVisible ? 1 : 0,
                      fontSize: RFPercentage(2),
                      color: "#e5d8fc",
                    }}
                  >
                    _
                  </Text>
                </Text>
              )}
            </View>

            {username && (
              <>
                <TextInput
                  className="bg-[#1e1830] text-start px-4 py-3 placeholder:opacity-40 text-[#b0a9d3] m-4 rounded-lg"
                  placeholder={placeholderText}
                  placeholderTextColor="#b0a9d3"
                  style={{
                    fontSize: RFPercentage(2.5),
                    fontFamily: "monospace",
                    height: 55,
                    width: inputWidth,
                  }}
                  value={inputValue}
                  onChangeText={setInputValue}
                />

                {/* Weather Feature */}
                <View className="mt-6 items-center">
                  <TouchableOpacity
                    className="bg-blue-500 p-4 rounded-2xl"
                    onPress={recVoice}
                  >
                    <Text className="text-white font-bold">
                      Start recording
                    </Text>
                  </TouchableOpacity>

                  {weatherLoading && (
                    <ActivityIndicator
                      size="large"
                      color="#ffffff"
                      className="mt-4"
                    />
                  )}

                  {weatherError && (
                    <Text className="text-red-500 mt-4">{weatherError}</Text>
                  )}

                  {weather && (
                    <View className="mt-4 p-4 bg-gray-800 rounded-xl w-64">
                      <Text>Region: {weather?.region || "Unknown"}</Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </View>

          {!username && (
            <View
              style={{
                position: "absolute",
                bottom: 30,
                flexDirection: "row",
                alignItems: "center",
              }}
            ></View>
          )}
        </>
      )}
    </LinearGradient>
  );
}
