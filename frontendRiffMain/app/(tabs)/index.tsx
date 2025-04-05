import { useEffect, useState, useRef } from "react";
import SpotifyLoginButton from "@/components/SpotifyLoginButton";
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
  Animated,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
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
import { CreatePlaylistButton } from "../../components/CreatePlaylistButton";
import TamaguiTest from "@/components/TamaguiTest";
import AutoCarousel from "@/components/AutoCarousel";
import Visualiser from "@/components/Visualiser";
import AnimViz from "@/components/AnimViz";
import SubHeader from "@/components/SubHeader";

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
  const sampleNetworkImages = [
    "https://via.placeholder.com/400x300/FF0000/FFFFFF?text=Image+1",
    "https://via.placeholder.com/400x300/00FF00/FFFFFF?text=Image+2",
    "https://via.placeholder.com/400x300/0000FF/FFFFFF?text=Image+3",
    "https://via.placeholder.com/400x300/FFFF00/000000?text=Image+4",
    "https://via.placeholder.com/400x300/FF00FF/FFFFFF?text=Image+5",
  ];
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
    )}&scope=user-read-email user-read-private playlist-modify-public playlist-modify-private`;
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
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Add gradient animation
  useEffect(() => {
    let animationFrameId: number;
    let lastUpdate = Date.now();
    const updateInterval = 50; // Update every 50ms

    const animate = () => {
      const now = Date.now();
      if (now - lastUpdate >= updateInterval) {
        setGradientPosition((prev) => (prev + 1) % 360);
        lastUpdate = now;
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
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
      const debouncedUpdate = setTimeout(updateContentHeight, 100);
      window.addEventListener("resize", () => {
        clearTimeout(debouncedUpdate);
        setTimeout(updateContentHeight, 100);
      });
      return () => {
        window.removeEventListener("resize", updateContentHeight);
        clearTimeout(debouncedUpdate);
      };
    }
  }, [songRecommendations, emotionData, screenHeight]);

  return (
    <View style={{ flex: 1 }}>
      {username && (
        <View
          style={{
            position: "absolute",
            right: Platform.OS === "web" ? 24 : 24,
            top: Platform.OS === "web" ? 24 : 24,
            zIndex: 9999,
          }}
        >
          <TouchableOpacity
            onPress={() => setMenuVisible(!menuVisible)}
            className="bg-white/5 backdrop-blur-xl p-3 rounded-full border border-white/10 shadow-lg transform transition-all duration-300 active:scale-95 hover:shadow-2xl"
          >
            <MaterialIcons name="account-circle" size={32} color="#8b5cf6" />
          </TouchableOpacity>

          {menuVisible && (
            <View
              className="absolute right-0 top-16 w-56 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl overflow-hidden"
              style={{
                transform: [{ scale: menuVisible ? 1 : 0.95 }],
                opacity: menuVisible ? 1 : 0,
              }}
            >
              <View className="p-4">
                <View className="flex-row items-center space-x-3 mb-4 pb-3 border-b border-white/10">
                  <MaterialIcons
                    name="account-circle"
                    size={24}
                    color="#8b5cf6"
                  />
                  <Text className="text-white font-semibold text-lg">
                    {username}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleLogout}
                  className="flex-row items-center space-x-3 p-3 rounded-lg hover:bg-white/5 transition-colors duration-200"
                >
                  <MaterialIcons name="logout" size={20} color="#ef4444" />
                  <Text className="text-red-400 font-medium">Sign Out</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}
      <ScrollView
        className="flex-1"
        style={{
          backgroundColor: "#0a0a1a",
          ...(Platform.OS === "web" && screenWidth > 768
            ? {
                width: screenWidth,
                maxWidth: screenWidth,
              }
            : {}),
        }}
        contentContainerStyle={{
          alignItems: "center",
          paddingBottom: 40,
          minHeight: "100%",
          flexGrow: 1,
          ...(Platform.OS === "web" && screenWidth > 768
            ? {
                maxWidth: 1200,
                marginHorizontal: "auto",
                paddingHorizontal: 20,
              }
            : {}),
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          ref={contentRef}
          className="w-full items-center relative z-10"
          style={{
            minHeight: screenHeight,
            ...(Platform.OS === "web" && screenWidth > 768
              ? {
                  maxWidth: 1200,
                  paddingHorizontal: 20,
                }
              : {}),
          }}
        >
          <View
            className="w-full items-center py-12 relative"
            style={{
              transform: [
                {
                  translateY: scrollY * 0.3,
                },
              ],
            }}
          >
            <View className="flex-1 justify-center items-center"></View>
          </View>
          {/* Login/Input Section */}
          {!username ? (
            <View className="flex-1 justify-between items-center">
              <TamaguiTest />
              <SubHeader />
              <SpotifyLoginButton />
            </View>
          ) : (
            //LOGGED OUT ENDS HERE
            //LOGGED IN STARTS HERE
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
                    className="w-full max-w-[600px]"
                  >
                    <View className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                      <View className="relative flex items-center justify-center">
                        <ActivityIndicator size="large" color="#8b5cf6" />
                        <View
                          className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-purple-600/20 blur-2xl"
                          style={{
                            transform: [{ scale: 2 }],
                            opacity:
                              0.5 + Math.sin(gradientPosition * 0.02) * 0.2,
                          }}
                        />
                      </View>
                      <Text className="text-center mt-6 text-lg bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent font-semibold">
                        Analyzing your input...
                      </Text>
                      <View
                        className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-blue-600/5"
                        style={{
                          transform: [{ rotate: `${gradientPosition}deg` }],
                        }}
                      />
                    </View>
                  </YStack>
                )}

                {analysisError && (
                  <YStack
                    enterStyle={{ opacity: 0, scale: 0.9 }}
                    exitStyle={{ opacity: 0, scale: 0.9 }}
                    animation="quick"
                    className="w-full max-w-[600px]"
                  >
                    <View className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-red-500/20 shadow-2xl overflow-hidden">
                      <View className="relative">
                        <MaterialIcons
                          name="error-outline"
                          size={32}
                          color="#f87171"
                          style={{ alignSelf: "center", marginBottom: 16 }}
                        />
                        <Text className="text-center text-lg bg-gradient-to-r from-red-400 to-red-500 bg-clip-text text-transparent font-semibold">
                          {analysisError}
                        </Text>
                        <View
                          className="absolute inset-0 bg-gradient-to-r from-red-600/5 to-red-800/5"
                          style={{
                            transform: [{ rotate: `${-gradientPosition}deg` }],
                          }}
                        />
                      </View>
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
                    <View className="bg-white/5 backdrop-blur-xl p-8 mt-14 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                      <View className="relative">
                        <View className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20 blur-2xl" />
                        <View className="relative z-10">
                          <Text className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500 font-bold mb-6 text-center">
                            Your Mood Analysis
                          </Text>
                          <View className="space-y-4">
                            <View className="bg-white/5 p-4 rounded-xl border border-white/10">
                              <Text className="text-purple-300/90 text-lg mb-2">
                                Emotion
                              </Text>
                              <Text className="text-white text-xl font-semibold">
                                {emotionData.emotion}
                              </Text>
                            </View>
                            <View className="bg-white/5 p-4 rounded-xl border border-white/10">
                              <Text className="text-purple-300/90 text-lg mb-2">
                                Mood
                              </Text>
                              <Text className="text-white text-xl font-semibold">
                                {emotionData.mood}
                              </Text>
                            </View>
                          </View>
                          <TouchableOpacity
                            onPress={() =>
                              getSongRecommendations(
                                emotionData.emotion,
                                emotionData.mood
                              )
                            }
                            disabled={loadingRecommendations}
                            className="mt-6 bg-gradient-to-r from-purple-600 to-blue-600 p-4 rounded-xl shadow-lg transform transition-all duration-300 active:scale-95 hover:shadow-2xl border border-white/10"
                            style={{
                              opacity: loadingRecommendations ? 0.7 : 1,
                            }}
                          >
                            <Text className="text-white font-bold text-lg text-center">
                              {loadingRecommendations
                                ? "Getting Recommendations..."
                                : "Get Song Recommendations"}
                            </Text>
                          </TouchableOpacity>
                        </View>
                        <View
                          className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-blue-600/5"
                          style={{
                            transform: [{ rotate: `${gradientPosition}deg` }],
                          }}
                        />
                      </View>
                    </View>
                  </YStack>
                )}

                {/* Song Recommendations */}
                {songRecommendations.length > 0 && (
                  <YStack
                    space="$4"
                    className="w-full max-w-[600px]"
                    enterStyle={{ opacity: 0, scale: 0.9, y: 20 }}
                    exitStyle={{ opacity: 0, scale: 0.9, y: -20 }}
                    animation="quick"
                  >
                    <Text className="text-3xl text-transparent bg-clip-text bg-gradient-to-r text-center from-purple-400 to-blue-500 font-bold mb-6">
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
                              className="bg-gradient-to-br from-[#1e1e1e] to-[#2a2a2a] p-4 rounded-full shadow-lg transform transition-all duration-300 active:scale-95 hover:shadow-2xl border border-[#1DB954]/20 group"
                              style={{
                                shadowColor: "#1DB954",
                                shadowOffset: { width: 0, height: 0 },
                                shadowOpacity: 0.1,
                                shadowRadius: 12,
                              }}
                            >
                              <View className="relative">
                                <MaterialIcons
                                  name="play-arrow"
                                  size={24}
                                  color="#1DB954"
                                  style={{
                                    opacity: 0.9,
                                  }}
                                />
                                <View
                                  className="absolute inset-0 bg-[#1DB954]/10 blur-xl group-hover:bg-[#1DB954]/20 transition-all duration-300"
                                  style={{
                                    transform: [{ scale: 1.5 }],
                                  }}
                                />
                              </View>
                            </TouchableOpacity>
                          )}
                        </View>
                      </Stack>
                    ))}
                    <YStack space="$4" className="mt-8">
                      <CreatePlaylistButton
                        emotion={emotionData?.emotion}
                        mood={emotionData?.mood}
                        playlistDescription="Your personalized playlist created by Riff AI"
                        isPublic={true}
                        songs={songRecommendations.map((song) => ({
                          name: song.name,
                          artist: song.artist,
                        }))}
                        onSuccess={() => {
                          // You can add a success message or notification here
                          console.log("Playlist created successfully!");
                        }}
                        onError={(error) => {
                          // You can add an error message or notification here
                          console.error("Failed to create playlist:", error);
                        }}
                      />
                    </YStack>
                  </YStack>
                )}
              </YStack>
            </AnimatePresence>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
