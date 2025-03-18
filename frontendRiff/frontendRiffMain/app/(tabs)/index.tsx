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
  ScrollView,
} from "react-native";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import TypeWriter from "react-native-typewriter";
import { RFPercentage } from "react-native-responsive-fontsize";
import { MaterialIcons } from "@expo/vector-icons";
import "../../global.css";
import Storage from "./storage";

// Define song recommendation interface
interface Song {
  name: string;
  artist: string;
  url: string;
  spotify_url?: string;
  image_url?: string;
}

interface SongRecommendationResponse {
  songs: Song[];
  message?: string;
}

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
  const [emotionData, setEmotionData] = useState<any>(null);
  const [emotionLoading, setEmotionLoading] = useState(false);
  const [songRecommendations, setSongRecommendations] = useState<Song[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState<
    string | null
  >(null);
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

  // Function to analyze text emotion
  const analyzeEmotion = async () => {
    if (!inputValue.trim()) return;

    setEmotionLoading(true);
    setEmotionData(null);

    try {
      // Make sure we have a token
      if (!token) {
        console.error("No authentication token available");
        setEmotionLoading(false);
        return;
      }

      console.log("Using token for authentication:", token);
      console.log("Analyzing text:", inputValue);

      // Call Django backend
      let response;
      let endpointUsed = "";

      try {
        console.log("Trying main analyze_text endpoint...");
        endpointUsed = "main";
        response = await fetch("http://localhost:8000/api/analyze_text/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text: inputValue }),
          credentials: "include",
        });

        if (!response.ok) {
          console.log(
            `Main endpoint returned status ${response.status}, trying mock endpoint...`
          );
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
      } catch (error) {
        console.log("Using mock analyze_text endpoint instead");
        endpointUsed = "mock";
        response = await fetch("http://localhost:8000/api/mock_analyze_text/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text: inputValue }),
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Mock endpoint error! Status: ${response.status}`);
        }
      }

      try {
        const data = await response.json();
        setEmotionData(data);
        console.log(
          `Emotion analysis result (from ${endpointUsed} endpoint):`,
          data
        );
      } catch (parseError) {
        console.error("Error parsing JSON response:", parseError);
        throw new Error("Failed to parse response data");
      }
    } catch (error) {
      console.error("Error analyzing emotion:", error);
      alert("Unable to analyze text. Please try again later.");
    } finally {
      setEmotionLoading(false);
    }
  };

  // Function to get song recommendations
  const getSongRecommendations = async () => {
    if (!emotionData) {
      console.error("No emotion data available for song recommendations");
      return;
    }

    setRecommendationsLoading(true);
    setSongRecommendations([]);
    setRecommendationsError(null);

    console.log("Getting song recommendations based on:", {
      query: inputValue,
      emotion: emotionData.emotion,
      mood: emotionData.mood,
    });

    try {
      // Call Django backend for recommendations
      console.log("Fetching song recommendations from backend...");

      const response = await fetch(
        "http://localhost:8000/api/song_recommendations/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            query: inputValue,
            emotion: emotionData.emotion,
            mood: emotionData.mood,
          }),
          credentials: "include",
        }
      );

      if (!response.ok) {
        console.error(
          `Song recommendation request failed with status: ${response.status}`
        );
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      try {
        const data = await response.json();

        if (!data || !data.songs || !Array.isArray(data.songs)) {
          console.error("Invalid response format:", data);
          throw new Error("Received invalid data format from server");
        }

        console.log(
          `Received ${data.songs.length} song recommendations:`,
          data
        );

        if (data.songs.length === 0) {
          setRecommendationsError(
            "No songs found matching your mood. Try a different input."
          );
        } else {
          setSongRecommendations(data.songs);
        }
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        throw new Error("Failed to parse response data");
      }
    } catch (error) {
      console.error("Error getting song recommendations:", error);
      setRecommendationsError(
        "Failed to get recommendations. Please try again."
      );
    } finally {
      setRecommendationsLoading(false);
    }
  };

  // Function to handle input submission
  const handleInputSubmit = () => {
    analyzeEmotion();
  };

  // Function to open song URL
  const openSongUrl = (song: Song) => {
    // Prefer Spotify URL if available, otherwise fallback to Last.fm URL
    const url = song.spotify_url || song.url;
    Linking.openURL(url);
  };

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
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
          }}
        >
          <View
            style={{
              alignItems: "center",
              transform: [{ scale: isDesktop ? 0.8 : 1 }],
              width: "100%",
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
                <View style={{ flexDirection: "row", alignItems: "center" }}>
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
                    onSubmitEditing={handleInputSubmit}
                  />
                  <TouchableOpacity
                    onPress={handleInputSubmit}
                    className="bg-[#4a3b78] p-3 rounded-lg"
                  >
                    <Text className="text-white">Analyze</Text>
                  </TouchableOpacity>
                </View>

                {emotionLoading && (
                  <ActivityIndicator
                    size="small"
                    color="#e5d8fc"
                    className="mt-2"
                  />
                )}

                {emotionData && (
                  <View className="mt-4 p-4 bg-[#1a1a2e] rounded-xl w-[80%]">
                    <Text className="text-white text-lg font-bold mb-2">
                      Analysis Results
                    </Text>

                    <View className="flex-row items-center my-1">
                      <Text className="text-white font-semibold mr-2">
                        Mood:
                      </Text>
                      <Text
                        style={{
                          color:
                            emotionData.mood === "positive"
                              ? "#4ade80"
                              : emotionData.mood === "negative"
                              ? "#f87171"
                              : "#93c5fd",
                          fontWeight: "500",
                        }}
                      >
                        {emotionData.mood === "positive"
                          ? "Positive"
                          : emotionData.mood === "negative"
                          ? "Negative"
                          : "Neutral"}
                      </Text>
                    </View>

                    <View className="flex-row items-center my-1">
                      <Text className="text-white font-semibold mr-2">
                        Emotion:
                      </Text>
                      <Text
                        style={{
                          color:
                            emotionData.emotion === "joy"
                              ? "#facc15"
                              : emotionData.emotion === "sadness"
                              ? "#60a5fa"
                              : "#d1d5db",
                          fontWeight: "500",
                        }}
                      >
                        {emotionData.emotion === "joy"
                          ? "Joy"
                          : emotionData.emotion === "sadness"
                          ? "Sadness"
                          : "Neutral"}
                      </Text>
                    </View>

                    <Text
                      style={{
                        color: "#9ca3af",
                        fontSize: 14,
                        marginTop: 8,
                        marginBottom: 12,
                      }}
                    >
                      {emotionData.mood === "positive"
                        ? "You sound happy! Let's find some upbeat music for you."
                        : emotionData.mood === "negative"
                        ? "Sounds like you might need some comforting music."
                        : "Let's find some music that matches your vibe."}
                    </Text>

                    <TouchableOpacity
                      onPress={getSongRecommendations}
                      className="bg-[#4a3b78] p-3 rounded-lg mt-3 items-center"
                      disabled={recommendationsLoading}
                    >
                      <Text className="text-white">
                        {recommendationsLoading
                          ? "Finding Songs..."
                          : "Get Song Recommendations"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {recommendationsLoading && (
                  <ActivityIndicator
                    size="large"
                    color="#e5d8fc"
                    className="mt-4"
                  />
                )}

                {recommendationsError && (
                  <Text className="text-red-500 mt-4">
                    {recommendationsError}
                  </Text>
                )}

                {songRecommendations.length > 0 && (
                  <View className="mt-6 p-4 bg-[#1a1a2e] rounded-xl w-[90%]">
                    <Text className="text-white text-lg font-bold mb-3">
                      Song Recommendations
                    </Text>
                    {songRecommendations.map((song, index) => (
                      <TouchableOpacity
                        key={index}
                        className="p-3 border-b border-gray-700 flex-row items-center mb-2"
                        onPress={() => openSongUrl(song)}
                        style={{
                          backgroundColor: "rgba(30, 30, 50, 0.6)",
                          borderRadius: 8,
                          marginBottom: 10,
                          padding: 12,
                        }}
                      >
                        {song.image_url && (
                          <View
                            style={{
                              width: 60,
                              height: 60,
                              marginRight: 15,
                              borderRadius: 6,
                              overflow: "hidden",
                              backgroundColor: "#333",
                            }}
                          >
                            <img
                              src={song.image_url}
                              alt={`${song.name} cover`}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          </View>
                        )}
                        <View className="flex-1">
                          <Text className="text-white font-bold text-base">
                            {song.name}
                          </Text>
                          <Text className="text-gray-400">{song.artist}</Text>
                          {song.spotify_url && (
                            <Text className="text-[#1DB954] text-xs mt-1">
                              Open in Spotify
                            </Text>
                          )}
                        </View>
                        <MaterialIcons
                          name={song.spotify_url ? "music-note" : "open-in-new"}
                          size={24}
                          color={song.spotify_url ? "#1DB954" : "#e5d8fc"}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

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
        </ScrollView>
      )}
    </LinearGradient>
  );
}
