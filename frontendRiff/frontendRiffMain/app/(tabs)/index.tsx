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
import { Audio } from "expo-av";
import "../../global.css";
import Storage from "./storage";

export default function Index() {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
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
  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        alert("Microphone permission is required!");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync({
        isMeteringEnabled: true,
        android: {
          extension: ".m4a",
          outputFormat: 2, // MPEG_4
          audioEncoder: 3, // AAC
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: ".m4a",
          audioQuality: 127, // High quality (hardcoded)
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: undefined,
          bitsPerSecond: undefined,
        },
      });

      await newRecording.startAsync();
      setRecording(newRecording);
      setIsRecording(true);
      console.log("Recording started...");

      setTimeout(() => stopRecording(), 5000);
    } catch (error) {
      console.error("Recording error:", error);
    }
  };

  const sendTextForAnalysis = async (text: string) => {
    try {
      const response = await fetch(
        `http://localhost:8001/user_input/analyze_text?text=${encodeURIComponent(
          text
        )}`,
        {
          method: "POST", // FastAPI allows query parameters in POST too
          headers: { "Content-Type": "application/json" },
        }
      );

      console.log("📥 Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `❌ HTTP error! Status: ${response.status}, Message: ${errorText}`
        );
        return null;
      }

      const data = await response.json();
      console.log("✅ Analysis result:", data);
      return data;
    } catch (error) {
      console.error("❌ Error sending text:", error);
      return null;
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      console.log("🎤 Recording stopped! File:", uri);

      setRecording(null);
      setIsRecording(false);

      if (uri) {
        // Fetch the file as a Blob
        const response = await fetch(uri);
        const blob = await response.blob();

        const formData = new FormData();
        formData.append("file", blob, "audio.m4a");

        console.log("🚀 Uploading audio...");

        const uploadResponse = await fetch(
          "http://localhost:8001/user_input/analyze_audio",
          {
            method: "POST",
            body: formData,
          }
        );

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          throw new Error(`❌ Failed to send audio: ${errorText}`);
        }

        const result = await uploadResponse.json();

        // ✅ Log all relevant information
        console.log("📝 Transcription:", result.text);
        console.log(" Mood:", result.mood);
        console.log(" Emotion:", result.emotion); // Logs emotions like "anger" or "joy"
      }
    } catch (error) {
      console.error("❌ Error stopping recording:", error);
    }
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
                  onSubmitEditing={() => sendTextForAnalysis(inputValue)} // ✅ Triggers when "Enter" is pressed
                />

                {/* Weather Feature */}
                <View style={{ alignItems: "center", marginTop: 20 }}>
                  <TouchableOpacity
                    onPress={isRecording ? stopRecording : startRecording} // Toggle function
                    style={{
                      backgroundColor: isRecording ? "red" : "green", // Dynamic button color
                      padding: 12,
                      borderRadius: 10,
                      marginBottom: 10,
                    }}
                  >
                    <Text style={{ color: "white", fontWeight: "bold" }}>
                      {isRecording ? "Stop Recording" : "Start Recording"}{" "}
                      {/* Dynamic text */}
                    </Text>
                  </TouchableOpacity>
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
