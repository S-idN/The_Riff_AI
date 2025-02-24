import React, { useEffect, useState } from "react";
import { Text, View, Linking } from "react-native";
import { useRouter } from "expo-router";
import Spinner from "react-native-loading-spinner-overlay";
import { LinearGradient } from "expo-linear-gradient"; // Importing LinearGradient for gradient background
import { StyleSheet } from "react-native";

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

          const displayName = await fetchUserProfile(token);
          console.log("Display name fetched:", displayName);

          // Redirect to the homepage with display_name as a query param
          router.push({
            pathname: "/", // Relative path
            params: { display_name: displayName || "Guest" }, // Use `params` for query parameters
          });

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

    const initialUrl = Linking.getInitialURL();
    initialUrl
      .then((url) => {
        console.log("Initial URL on app launch:", url);
        if (url) handleUrl({ url });
      })
      .catch((err) => {
        console.error("Error while fetching initial URL:", err);
      });

    Linking.addEventListener("url", handleUrl);

    return () => {
      Linking.removeEventListener("url", handleUrl);
    };
  }, [router]);

  const fetchAccessToken = async (code) => {
    try {
      const response = await fetch("http://localhost:8000/api/auth/spotify-token/", { // Updated API endpoint
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get access token");
      }

      if (!data.access_token) {
        throw new Error("Access token is missing in the response.");
      }

      return data.access_token;
    } catch (error) {
      console.error("Error fetching access token:", error);
      throw new Error("Error fetching access token: " + error.message);
    }
  };

  const fetchUserProfile = async (token) => {
    try {
      const response = await fetch("http://localhost:8000/api/auth/profile/", { // Updated API endpoint
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log("Profile response:", data);

      return response.ok ? data.display_name : null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  };

  return (
    <LinearGradient
      colors={["#000000", "#02001f", "#000000"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Spinner visible={loading} textContent="Authenticating..." textStyle={styles.spinnerText} />
      <Text style={styles.title}>Spotify Authentication in Progress...</Text>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff", // White text color to contrast with the gradient background
    textAlign: "center",
    marginTop: 20,
  },
  errorText: {
    color: "red",
    fontSize: 16,
    marginTop: 10,
  },
  spinnerText: {
    color: "#0b6346", // Green gradient for the loading spinner text
  },
});
