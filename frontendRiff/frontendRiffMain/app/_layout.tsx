import { Stack } from "expo-router";

export default function RootLayout() {
  return (
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
  );
}
