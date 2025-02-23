import { useEffect, useState } from "react";
import {
  Text,
  View,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import { Link, useLocalSearchParams } from "expo-router";
import "../../global.css";
import Storage from "./storage";

export default function Index() {
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { display_name: paramsDisplayName, username: paramsUsername } =
    useLocalSearchParams<{ display_name?: string; username?: string }>();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await Storage.getItem("access_token");
        if (storedToken) {
          setToken(storedToken);
        }
      } catch (error) {
        console.error("Failed to load token:", error);
      }
    };

    loadToken();

    if (paramsDisplayName) {
      setUsername(paramsDisplayName);
      setLoading(false);
      return;
    }

    if (paramsUsername) {
      setUsername(paramsUsername);
      setLoading(false);
      return;
    }

    const fetchUserProfile = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      console.log("Access token:", token);

      try {
        // Replace ngrok link with local link
        const response = await fetch(
          "http://localhost:8000/api/auth/profile/", // Local URL for profile API
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
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
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [paramsDisplayName, paramsUsername, token]);

  const handleLogout = async () => {
    try {
      // Replace ngrok link with local link
      await fetch(
        "http://localhost:8000/api/auth/logout/", // Local URL for logout API
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );
    } catch (error) {
      console.error("Error logging out:", error);
    }

    await Storage.removeItem("access_token");

    setUsername(null);
    setToken(null);

    // Replace current URL with base URL (remove username param)
    window.history.replaceState(null, "", "/");

    // Refresh the page
    window.location.reload();
  };

  return (
    <View className="flex-1 justify-center items-center h-svh bg-[#0f0325] text-[#e5d8fc]">
      {/* Show logout button only if user is logged in */}
      {username && (
        <TouchableOpacity
          onPress={handleLogout}
          className="absolute top-4 left-4 bg-red-600 p-2 rounded-lg"
        >
          <Text className="text-white font-semibold">Logout</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#e5d8fc" />
      ) : (
        <>
          <Text className="text-[#e5d8fc] font-semibold text-2xl">
            {username ? `Logged in as ${username}` : "Riff.AI (fr this time)"}
          </Text>
          <Link className="text-[#e5d8fc] mt-4" href={"/about"}>
            Go to About Screen
          </Link>
        </>
      )}
    </View>
  );
}
