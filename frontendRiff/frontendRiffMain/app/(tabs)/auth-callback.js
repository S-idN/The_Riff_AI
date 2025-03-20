import React, { useEffect, useState } from "react";
import { Text, View, Linking } from "react-native";
import { useRouter } from "expo-router";
import Spinner from "react-native-loading-spinner-overlay";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AuthCallbackScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const handleUrl = async (event) => {
      const { url } = event;
      console.log("URL received:", url);

      const code = new URL(url).searchParams.get("code");
      console.log("Authorization code:", code);

      if (code) {
        try {
          const token = await fetchAccessToken(code);
          console.log("Access token received:", token);

          await AsyncStorage.setItem("access_token", token); // Store token

          const displayName = await fetchUserProfile(token);
          console.log("Display name fetched:", displayName);

          router.replace("/"); // Redirect AFTER token is stored
          setLoading(false);
        } catch (err) {
          console.error("Error during authentication:", err);
          setError(err.message || "Authentication failed.");
          setLoading(false);
        }
      } else {
        setError("Authorization code not found.");
        setLoading(false);
      }
    };

    Linking.getInitialURL()
      .then((url) => {
        console.log("Initial URL on app launch:", url);
        if (url) handleUrl({ url });
      })
      .catch((err) => console.error("Error fetching initial URL:", err));

    Linking.addEventListener("url", handleUrl);
    return () => Linking.removeEventListener("url", handleUrl);
  }, [router]);

  const fetchAccessToken = async (code) => {
    try {
      const response = await fetch("http://localhost:8000/api/auth/spotify-token/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          code, 
          platform: "web"
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.access_token) throw new Error("Failed to get access token");

      return data.access_token;
    } catch (error) {
      console.error("Error fetching access token:", error);
      throw new Error("Error fetching access token: " + error.message);
    }
  };

  const fetchUserProfile = async (token) => {
    try {
      const response = await fetch("http://localhost:8000/api/auth/profile/", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      return response.ok ? data.display_name : null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  };

  return (
    <LinearGradient colors={["#000000", "#02001f", "#000000"]} style={styles.container}>
      <Spinner visible={loading} textContent="Authenticating..." textStyle={styles.spinnerText} />
      <Text style={styles.title}>Spotify Authentication in Progress...</Text>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 16 },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff", textAlign: "center", marginTop: 20 },
  errorText: { color: "red", fontSize: 16, marginTop: 10 },
  spinnerText: { color: "#0b6346" },
});
