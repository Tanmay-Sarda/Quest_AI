import React from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import SignUpPage from "../page";

// __tests__/page.test.js
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

// __tests__/page.test.js
// Mocking necessary components and hooks
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock("axios");

jest.mock("@react-oauth/google", () => ({
  GoogleLogin: ({ onSuccess }) => (
    <button onClick={() => onSuccess({ credential: "test-credential" })}>
      Google Login
    </button>
  ),
}));

describe("SignUpPage() SignUpPage method", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Happy Paths", () => {
    test("should render the SignUpPage component correctly", () => {
      render(<SignUpPage />);
      expect(screen.getByText("BEGIN YOUR JOURNEY")).toBeInTheDocument();
      expect(screen.getByLabelText("NAME :")).toBeInTheDocument();
      expect(screen.getByLabelText("EMAIL :")).toBeInTheDocument();
      expect(screen.getByLabelText("PASS :")).toBeInTheDocument();
      expect(screen.getByText("[ SIGNUP ]")).toBeInTheDocument();
      expect(screen.getByText("Or sign in using")).toBeInTheDocument();
    });

    test("should handle form submission successfully", async () => {
      axios.post.mockResolvedValueOnce({
        data: {
          data: {
            user: {
              accessToken: "test-token",
              username: "testuser",
            },
          },
        },
      });

      render(<SignUpPage />);

      fireEvent.change(screen.getByLabelText("NAME :"), {
        target: { value: "testuser" },
      });
      fireEvent.change(screen.getByLabelText("EMAIL :"), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByLabelText("PASS :"), {
        target: { value: "password123" },
      });

      fireEvent.click(screen.getByText("[ SIGNUP ]"));

      await waitFor(() => {
        expect(
          screen.getByText("✅ Registration successful! Redirecting...")
        ).toBeInTheDocument();
      });
    });

    test("should handle Google login successfully", async () => {
      const { push } = useRouter();

      render(<SignUpPage />);

      fireEvent.click(screen.getByText("Google Login"));

      await waitFor(() => {
        expect(
          screen.getByText("✅ Logged in successfully via Google!")
        ).toBeInTheDocument();
        expect(push).toHaveBeenCalledWith("/Home/testuser");
      });
    });
  });

  describe("Edge Cases", () => {
    test("should show error when form fields are empty", () => {
      render(<SignUpPage />);

      fireEvent.click(screen.getByText("[ SIGNUP ]"));

      expect(
        screen.getByText("⚠️ All fields are required!")
      ).toBeInTheDocument();
    });

    test("should show error when password is less than 6 characters", () => {
      render(<SignUpPage />);

      fireEvent.change(screen.getByLabelText("NAME :"), {
        target: { value: "testuser" },
      });
      fireEvent.change(screen.getByLabelText("EMAIL :"), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByLabelText("PASS :"), {
        target: { value: "123" },
      });

      fireEvent.click(screen.getByText("[ SIGNUP ]"));

      expect(
        screen.getByText("⚠️ Password must be at least 6 characters long!")
      ).toBeInTheDocument();
    });

    test("should handle network error gracefully", async () => {
      axios.post.mockRejectedValueOnce(new Error("Network Error"));

      render(<SignUpPage />);

      fireEvent.change(screen.getByLabelText("NAME :"), {
        target: { value: "testuser" },
      });
      fireEvent.change(screen.getByLabelText("EMAIL :"), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByLabelText("PASS :"), {
        target: { value: "password123" },
      });

      fireEvent.click(screen.getByText("[ SIGNUP ]"));

      await waitFor(() => {
        expect(
          screen.getByText("⚠️ Network error. Please try again.")
        ).toBeInTheDocument();
      });
    });
  });
});
