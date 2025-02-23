import React, { useEffect, useState } from "react";
import { Text, View, Linking } from "react-native";
import { useRouter } from "expo-router";

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

  if (loading) {
    return <Text>Loading...</Text>;
  }

  if (error) {
    return <Text>Error: {error}</Text>;
  }

  return <Text>Redirecting...</Text>;
}
