import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Load token from storage on mount
    AsyncStorage.getItem("access_token")
      .then((storedToken) => {
        if (storedToken) {
          setToken(storedToken);
        }
      })
      .catch((error) => {
        console.error("Error loading token:", error);
      });
  }, []);

  const handleSetToken = async (newToken: string | null) => {
    setToken(newToken);
    if (newToken) {
      await AsyncStorage.setItem("access_token", newToken);
    } else {
      await AsyncStorage.removeItem("access_token");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        setToken: handleSetToken,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
