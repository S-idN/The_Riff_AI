import { Tabs } from "expo-router";

export default function RootLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="+not-found"
        options={{
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="login"
        options={{
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
