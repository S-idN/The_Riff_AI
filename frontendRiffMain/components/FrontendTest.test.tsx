import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import SpotifyLoginButton from "./SpotifyLoginButton";
import { Linking } from "react-native";

// Mock Linking to prevent real navigation
jest.mock("react-native/Libraries/Linking/Linking", () => ({
  openURL: jest.fn(),
}));

describe("SpotifyLoginButton Component", () => {
  it("renders correctly", () => {
    const { getByText } = render(<SpotifyLoginButton />);

    expect(getByText("Login with Spotify")).toBeTruthy();
    expect(
      getByText("Ready to listen? Login to start creating playlists ✨")
    ).toBeTruthy();
  });

  it("opens Spotify auth URL when pressed", async () => {
    const { getByTestId } = render(<SpotifyLoginButton />);
    const button = getByTestId("spotify-login-button");

    fireEvent.press(button);

    await waitFor(() => {
      expect(Linking.openURL).toHaveBeenCalledWith(
        expect.stringContaining("https://accounts.spotify.com/authorize")
      );
    });
  });
});
