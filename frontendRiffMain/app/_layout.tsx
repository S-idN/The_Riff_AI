import { Stack } from "expo-router";
import { TamaguiProvider } from "tamagui";
import { useFonts } from "expo-font";
import { useColorScheme } from "react-native";
import config from "../tamagui.config";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { AuthProvider } from "../context/AuthContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [loaded] = useFonts({
    Inter: require("@tamagui/font-inter/otf/Inter-Medium.otf"),
    InterBold: require("@tamagui/font-inter/otf/Inter-Bold.otf"),
  });

  useEffect(() => {
    if (loaded) {
      // Hide splash screen once fonts are loaded
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Show a loading indicator until fonts are loaded
  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TamaguiProvider
        config={config}
        defaultTheme={colorScheme === "dark" ? "dark" : "light"}
      >
        <AuthProvider>
          <Stack>
            {/* Tabs Screen (This will be the primary navigation container) */}
            <Stack.Screen
              name="(tabs)"
              options={{
                headerShown: false,
              }}
            />

            {/* Screens like 'storage' and 'auth callback' that won't appear in the tab bar */}
            <Stack.Screen
              name="storage"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="auth-callback"
              options={{
                headerShown: false,
              }}
            />

            {/* Fallback screen for 404 or not found */}
            <Stack.Screen
              name="+not-found"
              options={{
                headerShown: false,
              }}
            />
          </Stack>
        </AuthProvider>
      </TamaguiProvider>
    </GestureHandlerRootView>
  );
}
