import { useEffect, useState, useRef } from "react";
import {
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
  TextInput,
  Dimensions,
  Linking,
  ScrollView,
  Image,
} from "react-native";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import TypeWriter from "react-native-typewriter";
import { RFPercentage } from "react-native-responsive-fontsize";
import { MaterialIcons } from "@expo/vector-icons";
import { Stack, YStack, XStack } from "tamagui";
import { createAnimations } from "@tamagui/animations-react-native";
import { View as TamaguiView } from "tamagui";
import "../../global.css";
import Storage from "./storage";
import { Audio } from "expo-av";
import EmotionCard from "../../components/EmotionCard";
import { motion } from "framer-motion";
import { AnimatePresence } from "tamagui";

interface Song {
  name: string;
  artist: string;
  spotify_url?: string;
  image_url?: string;
}

export default function Index() {
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { display_name: paramsDisplayName, username: paramsUsername } =
    useLocalSearchParams<{ display_name?: string; username?: string }>();
  const [token, setToken] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [underscoreVisible, setUnderscoreVisible] = useState(true);
  const [weather, setWeather] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [emotionData, setEmotionData] = useState<{
    emotion: string;
    mood: string;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [songRecommendations, setSongRecommendations] = useState<Song[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const placeholderText = "What are you in the mood for ?";
  const screenWidth = Dimensions.get("window").width;
  const isDesktop = screenWidth > 1200;
  const inputWidth = isDesktop
    ? screenWidth * 0.4
    : Math.min(screenWidth * 0.8, 450);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [scrollY, setScrollY] = useState(0);
  const [gradientPosition, setGradientPosition] = useState(0);
  const screenHeight = Dimensions.get("window").height;
  const [contentHeight, setContentHeight] = useState(screenHeight);
  const contentRef = useRef<View>(null);

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

  // Function to get song recommendations based on emotion and mood
  const getSongRecommendations = async (emotion: string, mood: string) => {
    if (!token) return;

    setLoadingRecommendations(true);
    try {
      const response = await fetch(
        "http://localhost:8000/api/get_mood_recommendations/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ emotion, mood }),
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setSongRecommendations(data.songs);
    } catch (error) {
      console.error("Error getting recommendations:", error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // Update analyzeText to get recommendations after emotion analysis
  const analyzeText = async () => {
    if (!inputValue.trim() || !token) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setSongRecommendations([]);

    try {
      console.log("Analyzing text:", inputValue);
      const response = await fetch("http://localhost:8000/api/analyze_text/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: inputValue }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Emotion analysis result:", data);
      const newEmotionData = {
        emotion: data.emotion,
        mood: data.mood,
      };
      setEmotionData(newEmotionData);

      // Get song recommendations based on emotion and mood
      await getSongRecommendations(data.emotion, data.mood);
    } catch (error) {
      console.error("Error analyzing text:", error);
      setAnalysisError("Failed to analyze text. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Function to start recording
  const startRecording = async () => {
    try {
      if (Platform.OS === "web") {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        mediaRecorderRef.current = new MediaRecorder(stream, {
          mimeType: "audio/mp4",
        });
        chunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
      } else {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        setRecording(recording);
        setIsRecording(true);
      }
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        Platform.OS === "web" &&
        err.message.includes("MIME")
      ) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          mediaRecorderRef.current = new MediaRecorder(stream, {
            mimeType: "audio/webm",
          });
          chunksRef.current = [];

          mediaRecorderRef.current.ondataavailable = (e) => {
            if (e.data.size > 0) {
              chunksRef.current.push(e.data);
            }
          };

          mediaRecorderRef.current.start();
          setIsRecording(true);
          return;
        } catch (webmErr) {
          console.error("Failed to use audio/webm format:", webmErr);
        }
      }
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      console.error("Failed to start recording:", errorMessage);
      setAnalysisError("Failed to start recording. Please check permissions.");
    }
  };

  // Function to stop recording and analyze
  const stopRecording = async () => {
    setIsRecording(false);
    try {
      if (Platform.OS === "web") {
        return new Promise<void>((resolve) => {
          if (mediaRecorderRef.current) {
            mediaRecorderRef.current.onstop = async () => {
              const audioBlob = new Blob(chunksRef.current, {
                type: "audio/mp4",
              });
              await handleVoiceAnalysis(audioBlob);

              if (mediaRecorderRef.current?.stream) {
                const stream = mediaRecorderRef.current.stream;
                stream.getTracks().forEach((track) => track.stop());
              }

              resolve();
            };
            mediaRecorderRef.current.stop();
          }
        });
      } else {
        if (!recording) return;
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        if (!uri) throw new Error("No recording URI available");
        await handleVoiceAnalysis(uri);
        setRecording(null);
      }
    } catch (err) {
      console.error("Failed to stop recording", err);
      setAnalysisError("Failed to process recording.");
    }
  };

  // Function to handle voice recording analysis
  const handleVoiceAnalysis = async (audioData: string | Blob) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setSongRecommendations([]);

    try {
      const formData = new FormData();

      if (Platform.OS === "web") {
        const mimeType = (audioData as Blob).type;
        const fileExtension = mimeType === "audio/mp4" ? ".mp4" : ".webm";
        formData.append("file", audioData as Blob, `recording${fileExtension}`);
      } else {
        formData.append("file", {
          uri: audioData as string,
          type: "audio/wav",
          name: "recording.wav",
        } as any);
      }

      console.log(
        "Sending audio data to server with type:",
        (audioData as Blob).type
      );
      const response = await fetch("http://localhost:8000/api/analyze_audio/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server response:", errorText);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Audio analysis result:", data);

      const newEmotionData = {
        emotion: data.emotion,
        mood: data.mood,
      };
      setEmotionData(newEmotionData);

      // Get song recommendations based on emotion and mood
      await getSongRecommendations(data.emotion, data.mood);
    } catch (error) {
      console.error("Error analyzing audio:", error);
      setAnalysisError("Failed to analyze audio. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Add gradient animation
  useEffect(() => {
    const interval = setInterval(() => {
      setGradientPosition((prev) => (prev + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Add effect to update content height
  useEffect(() => {
    const updateContentHeight = () => {
      if (contentRef.current) {
        contentRef.current.measure((x, y, width, height, pageX, pageY) => {
          const newHeight = Math.max(height, screenHeight);
          setContentHeight(newHeight);
        });
      }
    };

    // Update height when songs change or content changes
    updateContentHeight();

    // Add resize listener for web
    if (Platform.OS === "web") {
      window.addEventListener("resize", updateContentHeight);
      return () => window.removeEventListener("resize", updateContentHeight);
    }
  }, [songRecommendations, emotionData, screenHeight]);

  return (
    <ScrollView
      className="flex-1 bg-[#0f0f1e]"
      contentContainerStyle={{
        alignItems: "center",
        paddingBottom: 40,
        minHeight: "100%",
        flexGrow: 1,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Animated Background Elements */}
      <View
        className="fixed inset-0 w-screen overflow-hidden backdrop-blur-[100px]"
        style={{
          position: "fixed",
          height: contentHeight * 1.2, // Add extra height for smooth scrolling
          minHeight: screenHeight,
        }}
      >
        <View
          className="absolute w-[200vw] rounded-[40%] opacity-35 blur-2xl"
          style={{
            height: contentHeight * 1.2,
            top: -100 + Math.sin(gradientPosition * 0.02) * 30,
            left: -50 + Math.cos(gradientPosition * 0.02) * 30,
            transform: [
              { rotate: `${gradientPosition * 0.5}deg` },
              { scale: 1 + Math.sin(gradientPosition * 0.01) * 0.2 },
              { skewX: `${Math.sin(gradientPosition * 0.015) * 5}deg` },
              { skewY: `${Math.cos(gradientPosition * 0.015) * 5}deg` },
            ],
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.05)",
          }}
        >
          <LinearGradient
            colors={[
              `rgba(99,102,241,${
                0.3 + Math.sin(gradientPosition * 0.01) * 0.1
              })`,
              `rgba(79,70,229,${
                0.3 + Math.cos(gradientPosition * 0.01) * 0.1
              })`,
              `rgba(59,130,246,${
                0.3 + Math.sin(gradientPosition * 0.01) * 0.1
              })`,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "40%",
              filter: "blur(100px)",
            }}
          />
        </View>
        <View
          className="absolute w-[180vw] rounded-[45%] opacity-35 blur-2xl"
          style={{
            height: contentHeight * 1.2,
            bottom: -80 + Math.cos(gradientPosition * 0.02) * 40,
            right: -30 + Math.sin(gradientPosition * 0.02) * 40,
            transform: [
              { rotate: `${-gradientPosition * 0.3}deg` },
              { scale: 1 + Math.cos(gradientPosition * 0.015) * 0.15 },
              { skewX: `${Math.cos(gradientPosition * 0.02) * 7}deg` },
              { skewY: `${Math.sin(gradientPosition * 0.02) * 7}deg` },
            ],
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.05)",
          }}
        >
          <LinearGradient
            colors={[
              `rgba(59,130,246,${
                0.3 + Math.cos(gradientPosition * 0.01) * 0.1
              })`,
              `rgba(79,70,229,${
                0.3 + Math.sin(gradientPosition * 0.01) * 0.1
              })`,
              `rgba(99,102,241,${
                0.3 + Math.cos(gradientPosition * 0.01) * 0.1
              })`,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "45%",
              filter: "blur(100px)",
            }}
          />
        </View>
        <View
          className="absolute inset-0 backdrop-blur-3xl"
          style={{
            opacity: 0.15 + Math.sin(gradientPosition * 0.01) * 0.1,
            height: contentHeight * 1.2,
            minHeight: screenHeight,
          }}
        >
          <LinearGradient
            colors={[
              `rgba(79,70,229,${
                0.2 + Math.sin(gradientPosition * 0.01) * 0.05
              })`,
              "transparent",
              `rgba(59,130,246,${
                0.2 + Math.cos(gradientPosition * 0.01) * 0.05
              })`,
            ]}
            start={{
              x: 0.5 + Math.sin(gradientPosition * 0.01) * 0.2,
              y: 0.5 + Math.cos(gradientPosition * 0.01) * 0.2,
            }}
            end={{ x: 1, y: 1 }}
            style={{
              width: "100%",
              height: "100%",
              minHeight: screenHeight,
              filter: "blur(80px)",
            }}
          />
        </View>
      </View>

      <View
        ref={contentRef}
        className="w-full items-center relative z-10"
        style={{ minHeight: screenHeight }}
      >
        {/* Header Section with Parallax */}
        <View
          className="w-full items-center py-12"
          style={{
            transform: [
              {
                translateY: scrollY * 0.3,
              },
            ],
          }}
        >
          <Text
            className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500 mb-4"
            style={{ fontFamily: "monospace" }}
          >
            Riff
          </Text>
          <Text
            className="text-xl text-purple-300/90 text-center px-4 backdrop-blur-sm"
            style={{ fontFamily: "monospace" }}
          >
            Discover music that matches your mood
          </Text>
        </View>

        {/* Login/Input Section */}
        {!username ? (
          <TouchableOpacity
            className="bg-gradient-to-r from-[#1DB954] to-[#1ed760] px-12 py-6 rounded-full shadow-lg transform transition-all duration-300 active:scale-95 hover:shadow-2xl"
            style={{
              transform: [
                {
                  translateY: -scrollY * 0.1,
                },
              ],
            }}
            onPress={handleSpotifyLogin}
          >
            <Text className="text-white font-bold text-xl">
              Login with Spotify
            </Text>
          </TouchableOpacity>
        ) : (
          <AnimatePresence>
            <YStack
              space="$6"
              className="w-full items-center px-4"
              enterStyle={{ opacity: 0, scale: 0.9, y: 20 }}
              exitStyle={{ opacity: 0, scale: 0.9, y: -20 }}
              animation="quick"
            >
              <View
                className="w-full max-w-[800px] backdrop-blur-xl bg-white/5 p-8 rounded-2xl border border-white/10 shadow-2xl"
                style={{
                  transform: [
                    {
                      translateY: -scrollY * 0.05,
                    },
                  ],
                }}
              >
                <View className="space-y-6">
                  <TextInput
                    className="w-full bg-[#1e1830]/80 text-start px-6 py-4 placeholder:opacity-40 text-[#b0a9d3] rounded-xl shadow-inner border border-white/5"
                    placeholder={placeholderText}
                    placeholderTextColor="#b0a9d3"
                    style={{
                      fontSize: RFPercentage(2.2),
                      fontFamily: "monospace",
                      height: 60,
                    }}
                    value={inputValue}
                    onChangeText={setInputValue}
                    onSubmitEditing={analyzeText}
                  />

                  <View className="flex-row justify-center space-x-4">
                    <TouchableOpacity
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-800 p-4 rounded-xl shadow-lg transform transition-all duration-300 active:scale-95 hover:shadow-2xl"
                      onPress={analyzeText}
                      disabled={isAnalyzing || !inputValue.trim()}
                      style={{
                        opacity: !inputValue.trim() || isAnalyzing ? 0.7 : 1,
                      }}
                    >
                      <Text className="text-white font-bold text-lg text-center">
                        {isAnalyzing ? "Analyzing..." : "Analyze Text"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="flex-1 bg-gradient-to-r from-purple-600 to-purple-800 p-4 rounded-xl shadow-lg transform transition-all duration-300 active:scale-95 hover:shadow-2xl"
                      onPress={isRecording ? stopRecording : startRecording}
                      disabled={isAnalyzing}
                      style={{
                        opacity: isAnalyzing ? 0.7 : 1,
                      }}
                    >
                      <Text className="text-white font-bold text-lg text-center">
                        {isAnalyzing
                          ? "Analyzing..."
                          : isRecording
                          ? "Stop Recording"
                          : "Record Voice"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Analysis Results with Dynamic Loading */}
              {isAnalyzing && (
                <YStack
                  enterStyle={{ opacity: 0, scale: 0.9 }}
                  exitStyle={{ opacity: 0, scale: 0.9 }}
                  animation="quick"
                  className="items-center mt-8"
                >
                  <View className="relative">
                    <ActivityIndicator size="large" color="#8b5cf6" />
                    <View
                      className="absolute inset-0 bg-purple-600/20 blur-2xl"
                      style={{
                        transform: [
                          {
                            scale: 1.5,
                          },
                        ],
                      }}
                    />
                  </View>
                  <Text className="text-purple-300 mt-4 text-lg backdrop-blur-sm">
                    Analyzing your input...
                  </Text>
                </YStack>
              )}

              {analysisError && (
                <YStack
                  enterStyle={{ opacity: 0, scale: 0.9 }}
                  exitStyle={{ opacity: 0, scale: 0.9 }}
                  animation="quick"
                  className="w-full max-w-[600px]"
                >
                  <View className="bg-red-500/10 backdrop-blur-xl p-6 rounded-xl border border-red-500/20">
                    <Text className="text-red-400 text-center text-lg">
                      {analysisError}
                    </Text>
                  </View>
                </YStack>
              )}

              {/* Emotion Results */}
              {emotionData && (
                <YStack
                  enterStyle={{ opacity: 0, scale: 0.9, y: 20 }}
                  exitStyle={{ opacity: 0, scale: 0.9, y: -20 }}
                  animation="quick"
                  className="w-full max-w-[600px]"
                >
                  <EmotionCard
                    data={emotionData}
                    onRequestSongs={() =>
                      getSongRecommendations(
                        emotionData.emotion,
                        emotionData.mood
                      )
                    }
                    isLoading={loadingRecommendations}
                  />
                </YStack>
              )}

              {/* Song Recommendations */}
              {songRecommendations.length > 0 && (
                <YStack
                  space="$4"
                  className="w-full max-w-[600px] mt-8"
                  enterStyle={{ opacity: 0, scale: 0.9, y: 20 }}
                  exitStyle={{ opacity: 0, scale: 0.9, y: -20 }}
                  animation="quick"
                >
                  <Text className="text-3xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500 font-bold mb-6">
                    Recommended Songs
                  </Text>
                  {songRecommendations.map((song, index) => (
                    <Stack
                      key={`${song.name}-${song.artist}-${index}`}
                      animation="quick"
                      enterStyle={{ opacity: 0, scale: 0.9, x: -20 }}
                      exitStyle={{ opacity: 0, scale: 0.9, x: 20 }}
                      pressStyle={{ scale: 0.97 }}
                      className="bg-white/5 backdrop-blur-xl p-6 rounded-xl border border-white/10 shadow-2xl transform transition-all duration-300 hover:shadow-purple-500/10"
                    >
                      <View className="flex-row items-center space-x-4">
                        {song.image_url ? (
                          <Image
                            source={{ uri: song.image_url }}
                            className="w-20 h-20 rounded-xl shadow-lg"
                            style={{ backgroundColor: "#2a2444" }}
                          />
                        ) : (
                          <View className="w-20 h-20 rounded-xl bg-gradient-to-br from-purple-600/20 to-blue-600/20" />
                        )}
                        <View className="flex-1">
                          <Text className="text-white font-bold text-xl mb-2">
                            {song.name}
                          </Text>
                          <Text className="text-purple-300/90 text-lg">
                            {song.artist}
                          </Text>
                        </View>
                        {song.spotify_url && (
                          <TouchableOpacity
                            onPress={() =>
                              song.spotify_url &&
                              Linking.openURL(song.spotify_url)
                            }
                            className="bg-[#1DB954] p-4 rounded-full shadow-lg transform transition-all duration-300 active:scale-95 hover:shadow-2xl"
                          >
                            <Text className="text-white font-bold text-lg">
                              Play
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </Stack>
                  ))}
                </YStack>
              )}
            </YStack>
          </AnimatePresence>
        )}
      </View>
    </ScrollView>
  );
}
