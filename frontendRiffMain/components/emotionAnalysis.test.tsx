import React from "react";
import { render } from "@testing-library/react-native";
import fetch from "node-fetch";

// Mock the fetch call for the Emotion Analysis API
jest.mock("node-fetch");
const { Response } = jest.requireActual("node-fetch");

interface EmotionAnalysisResponse {
  emotion: string;
  sentiment: string;
}

// Mock a login function that returns a token
const mockLogin = jest.fn().mockResolvedValue({
  token: "mock-token-123", // This is your mock token
});

test("Emotion analysis for negative sentiment", async () => {
  // Simulate login and retrieve token
  const { token } = await mockLogin();

  // Mock the response of the fetch request
  const mockFetchResponse = new Response(
    JSON.stringify({
      emotion: "sadness",
      sentiment: "negative",
    }),
    { status: 200 }
  );
  (fetch as unknown as jest.Mock).mockResolvedValueOnce(mockFetchResponse);

  // Simulating the fetch request
  const response = await fetch("http://localhost:8000/api/analyze_text/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, // Using the token here
    },
    body: JSON.stringify({ text: "I am feeling very sad and hopeless" }),
  });

  const data: EmotionAnalysisResponse = await response.json();

  expect(data.emotion).toBe("sadness");
  expect(data.sentiment).toBe("negative");
});
