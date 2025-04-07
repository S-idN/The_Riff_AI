// src/pages/user_page.tsx (or app/(tabs)/user_page.tsx)

import React, { useState, useEffect } from "react";
// Import necessary components
import {
  YStack,
  Text,
  Switch,
  Avatar,
  Separator,
  XStack,
  Spinner,
  Label,
} from "tamagui";
import Storage from "./storage";

// Define an interface for the expected user profile structure
interface UserProfile {
  display_name: string;
  images?: { url: string }[];
}

const UserPage: React.FC = () => {
  // State for controls
  const [isGeoIpActive, setIsGeoIpActive] = useState(false);
  const [isNicheActive, setIsNicheActive] = useState(false);

  // State for user profile data
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Fetch User Profile Logic ---
  useEffect(() => {
    // ... (fetch logic remains the same) ...
    const loadTokenAndFetchProfile = async () => {
      setIsLoading(true);
      setError(null);
      let storedToken: string | null = null;

      try {
        const tokenResult = await Storage.getItem("access_token");
        if (typeof tokenResult === "string" && tokenResult) {
          storedToken = tokenResult;
        } else {
          setError("Access token not found. Please log in.");
          setIsLoading(false);
          return;
        }

        const response = await fetch("https://api.spotify.com/v1/me", {
          headers: { Authorization: `Bearer ${storedToken}` },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `Failed to fetch profile: ${response.status} ${
              response.statusText
            } - ${errorData.error?.message || ""}`
          );
        }
        const data: UserProfile = await response.json();
        setUserProfile(data);
      } catch (err: any) {
        console.error("Error fetching profile:", err);
        setError(err.message || "An error occurred while fetching profile.");
      } finally {
        setIsLoading(false);
      }
    };
    loadTokenAndFetchProfile();
  }, []);

  // --- Handlers ---
  const handleGeoIpToggle = (checked: boolean) => {
    console.log("GeoIP Toggled:", checked);
    setIsGeoIpActive(checked);
  };

  const handleNicheToggle = (checked: boolean) => {
    console.log("Niche Playlists Toggled:", checked);
    setIsNicheActive(checked);
  };

  // --- Render Logic ---
  const profilePicUrl = userProfile?.images?.[0]?.url;
  const userName = userProfile?.display_name;
  const userInitial = userName ? userName[0].toUpperCase() : "?";

  // --- Define Colors/Styles based on the new request ---
  // bg-white/5
  const cardBackgroundColor = "rgba(255, 255, 255, 0.05)";
  // border-white/10
  const cardBorderColor = "rgba(255, 255, 255, 0.10)"; // Or theme token like '$whiteA4'
  // Adjusted text colors for better contrast on the light background
  const primaryTextColor = "$gray1"; // Dark text for username
  const secondaryTextColor = "$gray11"; // Darker gray for labels
  // Avatar fallback needs contrast too
  const avatarFallbackBg = "$gray5"; // Example, choose a contrasting color
  const avatarFallbackTextColor = "$gray1"; // Dark text for initial

  // Switch Colors need adjustment for the new background
  const switchAccentColor = "#A020F0"; // Keep purple for ON state frame
  const switchFrameOffColor = "$gray10"; // Darker frame for OFF state against light bg
  const switchThumbColor = "white"; // Keep thumb white

  // Define unique IDs for controls
  const geoIpId = "geoip-switch";
  const nicheId = "niche-switch";

  return (
    <YStack
      flex={1}
      backgroundColor="#080819" // Keep overall page background dark
      alignItems="center"
      justifyContent="center"
      padding="$4"
    >
      {/* Apply the new styles to this YStack (the card) */}
      <YStack
        // Style like the example box
        backgroundColor={cardBackgroundColor}
        borderRadius="$6" // Use $6 for 'rounded-xl' equivalent
        padding="$4" // Use $4 for 'p-4' equivalent
        borderWidth={1}
        borderColor={cardBorderColor}
        // Keep other layout props
        width="90%"
        maxWidth={450}
        alignItems="center"
        space="$7" // Keep vertical spacing inside the card
        minHeight={350}
        shadowColor="#000"
        shadowOffset={{ width: 0, height: 4 }}
        shadowOpacity={0.3}
        shadowRadius={6}
        elevation={5}
      >
        {isLoading ? (
          <Spinner size="large" color={primaryTextColor} /> // Use a visible color
        ) : error ? (
          <Text color="$red10" textAlign="center">
            {error}
          </Text>
        ) : userProfile ? (
          <>
            {/* --- Profile Section --- */}
            <YStack alignItems="center" space="$3">
              <Avatar circular size="$10">
                {profilePicUrl && (
                  <Avatar.Image source={{ uri: profilePicUrl }} />
                )}
                <Avatar.Fallback
                  backgroundColor={avatarFallbackBg} // Adjusted background
                  justifyContent="center"
                  alignItems="center"
                  borderWidth={0}
                >
                  <Text
                    fontSize="$6"
                    color={avatarFallbackTextColor}
                    fontWeight="bold"
                  >
                    {userInitial}
                  </Text>
                </Avatar.Fallback>
              </Avatar>
              {/* Use darker text color */}
              <Text fontSize="$6" color={primaryTextColor} fontWeight="600">
                {userName}
              </Text>
            </YStack>

            {/* --- Settings Section --- */}
            <YStack width="100%" space="$4">
              {/* --- GeoIP Setting --- */}
              <XStack
                width="100%"
                alignItems="center"
                justifyContent="space-between"
              >
                <Label
                  htmlFor={geoIpId}
                  fontSize="$4"
                  color={secondaryTextColor} // Use darker text color
                  flex={1}
                  marginRight="$4"
                  onPress={() => handleGeoIpToggle(!isGeoIpActive)}
                >
                  Activate GeoIP
                </Label>
                <Switch
                  id={geoIpId}
                  size="$4"
                  checked={isGeoIpActive}
                  onCheckedChange={handleGeoIpToggle}
                  // Adjusted frame colors for new background
                  backgroundColor={
                    isGeoIpActive ? switchAccentColor : switchFrameOffColor
                  }
                  borderColor={isGeoIpActive ? switchAccentColor : "$gray8"} // Optional subtle border
                >
                  <Switch.Thumb
                    animation="quicker"
                    backgroundColor={switchThumbColor} // Keep thumb white
                  />
                </Switch>
              </XStack>

              <Separator
                marginVertical="$2"
                // Use a darker separator color
                borderColor="$gray8" // Adjust token as needed
                opacity={0.5} // Make it subtle
              />

              {/* --- Niche Playlists Setting --- */}
              <XStack
                width="100%"
                alignItems="center"
                justifyContent="space-between"
              >
                <Label
                  htmlFor={nicheId}
                  fontSize="$4"
                  color={secondaryTextColor} // Use darker text color
                  flex={1}
                  marginRight="$4"
                  onPress={() => handleNicheToggle(!isNicheActive)}
                >
                  Activate Niche Playlists
                </Label>
                <Switch
                  id={nicheId}
                  size="$4"
                  checked={isNicheActive}
                  onCheckedChange={handleNicheToggle}
                  // Adjusted frame colors for new background
                  backgroundColor={
                    isNicheActive ? switchAccentColor : switchFrameOffColor
                  }
                  borderColor={isNicheActive ? switchAccentColor : "$gray8"} // Optional subtle border
                >
                  <Switch.Thumb
                    animation="quicker"
                    backgroundColor={switchThumbColor} // Keep thumb white
                  />
                </Switch>
              </XStack>
            </YStack>
          </>
        ) : (
          <Text color={secondaryTextColor}>Could not load profile.</Text> // Adjusted color
        )}
      </YStack>
    </YStack>
  );
};

export default UserPage;
