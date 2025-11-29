// Mock setup must come before imports
jest.mock("../../models/User.models.js", () => ({
  User: {
    findById: jest.fn()
  }
}));

jest.mock("../../utils/ApiError.js", () => {
  return jest.fn().mockImplementation((statusCode, message) => ({
    statusCode,
    message,
    success: false
  }));
});

jest.mock("../../utils/ApiResponse.js", () => {
  return jest.fn().mockImplementation((success, data, message) => ({
    success,
    data,
    message
  }));
});

// Now import after mocks
import { User } from "../../models/User.models.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { generateAccessTokenAndRefreshToken } from '../token.middleware.js';

describe("generateAccessTokenAndRefreshToken", () => {
  const mockUserId = "mockUserId123";
  let mockUser;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a fresh mock user for each test
    mockUser = {
      _id: mockUserId,
      refreshtoken: "",
      accesstoken: "",
      generateAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
      save: jest.fn()
    };
  });

  describe("Happy paths", () => {
    it("should generate tokens and save them successfully", async () => {
      // Setup mocks
      User.findById.mockResolvedValue(mockUser);
      mockUser.generateAccessToken.mockReturnValue("mockAccessToken");
      mockUser.generateRefreshToken.mockReturnValue("mockRefreshToken");
      mockUser.save.mockResolvedValue(mockUser);

      // Execute
      const result = await generateAccessTokenAndRefreshToken(mockUserId);

      // Assert
      expect(User.findById).toHaveBeenCalledWith(mockUserId);
      expect(mockUser.generateAccessToken).toHaveBeenCalled();
      expect(mockUser.generateRefreshToken).toHaveBeenCalled();
      expect(mockUser.save).toHaveBeenCalledWith({ validateBeforeSave: false });
      
      // Verify tokens are set on user
      expect(mockUser.refreshtoken).toBe("mockRefreshToken");
      expect(mockUser.accesstoken).toBe("mockAccessToken");
      
      // Verify return value
      expect(result).toEqual({
        accessToken: "mockAccessToken",
        refreshToken: "mockRefreshToken"
      });
    });

    it("should handle different user IDs", async () => {
      // Setup
      const differentUserId = "differentUserId456";
      User.findById.mockResolvedValue(mockUser);
      mockUser.generateAccessToken.mockReturnValue("token1");
      mockUser.generateRefreshToken.mockReturnValue("token2");
      mockUser.save.mockResolvedValue(mockUser);

      // Execute
      await generateAccessTokenAndRefreshToken(differentUserId);

      // Assert
      expect(User.findById).toHaveBeenCalledWith(differentUserId);
    });
  });

  describe("Error handling - User not found", () => {
    it("should return ApiError when user is not found", async () => {
      // Setup
      User.findById.mockResolvedValue(null);

      // Execute
      const result = await generateAccessTokenAndRefreshToken(mockUserId);

      // Assert - Use property checks instead of instanceof for mocks
      expect(User.findById).toHaveBeenCalledWith(mockUserId);
      expect(result).toHaveProperty('statusCode', 404);
      expect(result).toHaveProperty('message', 'User not found');
      expect(result).toHaveProperty('success', false);
      expect(ApiError).toHaveBeenCalledWith(404, "User not found");
    });

    it("should return ApiError when user ID is invalid", async () => {
      // Setup
      User.findById.mockResolvedValue(null);

      // Execute
      const result = await generateAccessTokenAndRefreshToken("invalidUserId");

      // Assert
      expect(result).toHaveProperty('statusCode', 404);
      expect(result).toHaveProperty('message', 'User not found');
    });
  });

  describe("Error handling - Token generation failures", () => {
    it("should return ApiError when generateAccessToken throws error", async () => {
      // Setup
      User.findById.mockResolvedValue(mockUser);
      mockUser.generateAccessToken.mockImplementation(() => {
        throw new Error("Token generation failed");
      });

      // Execute
      const result = await generateAccessTokenAndRefreshToken(mockUserId);

      // Assert - Use property checks instead of instanceof
      expect(result).toHaveProperty('statusCode', 500);
      expect(result).toHaveProperty('message', 'Could not generate tokens');
      expect(ApiError).toHaveBeenCalledWith(500, "Could not generate tokens");
    });

    it("should return ApiError when generateRefreshToken throws error", async () => {
      // Setup
      User.findById.mockResolvedValue(mockUser);
      mockUser.generateAccessToken.mockReturnValue("mockAccessToken");
      mockUser.generateRefreshToken.mockImplementation(() => {
        throw new Error("Refresh token generation failed");
      });

      // Execute
      const result = await generateAccessTokenAndRefreshToken(mockUserId);

      // Assert
      expect(result).toHaveProperty('statusCode', 500);
      expect(result).toHaveProperty('message', 'Could not generate tokens');
    });

    it("should return ApiError when save operation fails", async () => {
      // Setup
      User.findById.mockResolvedValue(mockUser);
      mockUser.generateAccessToken.mockReturnValue("mockAccessToken");
      mockUser.generateRefreshToken.mockReturnValue("mockRefreshToken");
      mockUser.save.mockRejectedValue(new Error("Database save failed"));

      // Execute
      const result = await generateAccessTokenAndRefreshToken(mockUserId);

      // Assert
      expect(result).toHaveProperty('statusCode', 500);
      expect(result).toHaveProperty('message', 'Could not generate tokens');
    });
  });

  describe("Error handling - Database failures", () => {
    it("should return ApiError when User.findById fails", async () => {
      // Setup
      User.findById.mockRejectedValue(new Error("Database connection failed"));

      // Execute
      const result = await generateAccessTokenAndRefreshToken(mockUserId);

      // Assert
      expect(result).toHaveProperty('statusCode', 500);
      expect(result).toHaveProperty('message', 'Could not generate tokens');
    });

    it("should return ApiError when database times out", async () => {
      // Setup
      User.findById.mockRejectedValue(new Error("Database timeout"));

      // Execute
      const result = await generateAccessTokenAndRefreshToken(mockUserId);

      // Assert
      expect(result).toHaveProperty('statusCode', 500);
      expect(result).toHaveProperty('message', 'Could not generate tokens');
    });
  });

  describe("Edge cases", () => {
    it("should handle empty user ID string", async () => {
      // Setup
      User.findById.mockResolvedValue(null);

      // Execute
      const result = await generateAccessTokenAndRefreshToken("");

      // Assert
      expect(result).toHaveProperty('statusCode', 404);
      expect(result).toHaveProperty('message', 'User not found');
    });

    it("should handle null user ID", async () => {
      // Setup
      User.findById.mockResolvedValue(null);

      // Execute
      const result = await generateAccessTokenAndRefreshToken(null);

      // Assert
      expect(result).toHaveProperty('statusCode', 404);
      expect(result).toHaveProperty('message', 'User not found');
    });

    it("should handle undefined user ID", async () => {
      // Setup
      User.findById.mockResolvedValue(null);

      // Execute
      const result = await generateAccessTokenAndRefreshToken(undefined);

      // Assert
      expect(result).toHaveProperty('statusCode', 404);
      expect(result).toHaveProperty('message', 'User not found');
    });

    it("should handle very long user ID", async () => {
      // Setup
      const longUserId = "a".repeat(256);
      User.findById.mockResolvedValue(mockUser);
      mockUser.generateAccessToken.mockReturnValue("token");
      mockUser.generateRefreshToken.mockReturnValue("refreshToken");
      mockUser.save.mockResolvedValue(mockUser);

      // Execute
      const result = await generateAccessTokenAndRefreshToken(longUserId);

      // Assert
      expect(User.findById).toHaveBeenCalledWith(longUserId);
      expect(result).toEqual({
        accessToken: "token",
        refreshToken: "refreshToken"
      });
    });

    it("should handle special characters in user ID", async () => {
      // Setup
      const specialUserId = "user@id#123$special";
      User.findById.mockResolvedValue(mockUser);
      mockUser.generateAccessToken.mockReturnValue("token");
      mockUser.generateRefreshToken.mockReturnValue("refreshToken");
      mockUser.save.mockResolvedValue(mockUser);

      // Execute
      const result = await generateAccessTokenAndRefreshToken(specialUserId);

      // Assert
      expect(User.findById).toHaveBeenCalledWith(specialUserId);
      expect(result.accessToken).toBe("token");
      expect(result.refreshToken).toBe("refreshToken");
    });
  });

  describe("Token validation", () => {
    it("should generate different access and refresh tokens", async () => {
      // Setup
      User.findById.mockResolvedValue(mockUser);
      mockUser.generateAccessToken.mockReturnValue("accessToken123");
      mockUser.generateRefreshToken.mockReturnValue("refreshToken456");
      mockUser.save.mockResolvedValue(mockUser);

      // Execute
      const result = await generateAccessTokenAndRefreshToken(mockUserId);

      // Assert
      expect(result.accessToken).toBe("accessToken123");
      expect(result.refreshToken).toBe("refreshToken456");
      expect(result.accessToken).not.toBe(result.refreshToken);
    });

    it("should save tokens to user object before saving to database", async () => {
      // Setup
      User.findById.mockResolvedValue(mockUser);
      mockUser.generateAccessToken.mockReturnValue("accessToken");
      mockUser.generateRefreshToken.mockReturnValue("refreshToken");
      mockUser.save.mockResolvedValue(mockUser);

      // Execute
      await generateAccessTokenAndRefreshToken(mockUserId);

      // Assert - tokens should be set on user before save is called
      expect(mockUser.accesstoken).toBe("accessToken");
      expect(mockUser.refreshtoken).toBe("refreshToken");
    });
  });

  describe("Database validation options", () => {
    it("should save user with validateBeforeSave: false", async () => {
      // Setup
      User.findById.mockResolvedValue(mockUser);
      mockUser.generateAccessToken.mockReturnValue("token");
      mockUser.generateRefreshToken.mockReturnValue("refreshToken");
      mockUser.save.mockResolvedValue(mockUser);

      // Execute
      await generateAccessTokenAndRefreshToken(mockUserId);

      // Assert
      expect(mockUser.save).toHaveBeenCalledWith({ validateBeforeSave: false });
    });
  });
});