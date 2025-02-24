import { Tabs } from "expo-router";

export default function RootLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          tabBarStyle: {
            display: "none",
            backgroundColor: "#1f1f1f", // Tab bar background color
            height: 70, // Tab bar height
          },
          tabBarActiveTintColor: "#f0f", // Active tab color
          tabBarInactiveTintColor: "#aaa", // Inactive tab color
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          headerShown: false,
          tabBarStyle: {
            display: "none",
            backgroundColor: "#1f1f1f", // Tab bar background color
            height: 70, // Tab bar height
          },
          tabBarActiveTintColor: "#f0f", // Active tab color
          tabBarInactiveTintColor: "#aaa", // Inactive tab color
        }}
      />
      <Tabs.Screen
        name="+not-found"
        options={{
          headerShown: false,
          tabBarStyle: {
            display: "none",
            backgroundColor: "#1f1f1f", // Tab bar background color
            height: 70, // Tab bar height
          },
          tabBarActiveTintColor: "#f0f", // Active tab color
          tabBarInactiveTintColor: "#aaa", // Inactive tab color
        }}
      />
      <Tabs.Screen
        name="login"
        options={{
          headerShown: false,
          tabBarStyle: {
            display: "none", // Hide the tab bar on the login screen
          },
        }}
      />
      <Tabs.Screen
        name="auth-callback"
        options={{
          headerShown: false,
          tabBarStyle: {
            display: "none", // Hide the tab bar on the login screen
          },
        }}
      />
    </Tabs>
  );
}
