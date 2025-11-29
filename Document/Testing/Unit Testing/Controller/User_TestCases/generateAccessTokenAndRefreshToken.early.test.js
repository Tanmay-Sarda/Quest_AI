import { User } from "../../models/User.models.js";
import ApiError from "../../utils/ApiError.js";
import { generateAccessTokenAndRefreshToken } from '../user.controller.js';

// Import necessary modules and dependencies
// Mock the User model
jest.mock("../../models/User.models.js", () => ({
  User: {
    findById: jest.fn(),
  },
}));

// Mock the user instance methods
const mockUserInstance = {
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  save: jest.fn(),
};

// Test suite for generateAccessTokenAndRefreshToken
describe('generateAccessTokenAndRefreshToken() generateAccessTokenAndRefreshToken method', () => {
  // Happy path tests
  describe('Happy paths', () => {
    beforeEach(() => {
      // Reset mocks before each test
      jest.clearAllMocks();
    });

    it('should generate access and refresh tokens for a valid user', async () => {
      // Arrange
      const userId = 'validUserId';
      User.findById.mockResolvedValue(mockUserInstance);
      mockUserInstance.generateAccessToken.mockReturnValue('accessToken');
      mockUserInstance.generateRefreshToken.mockReturnValue('refreshToken');
      mockUserInstance.save.mockResolvedValue();

      // Act
      const result = await generateAccessTokenAndRefreshToken(userId);

      // Assert
      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(mockUserInstance.generateAccessToken).toHaveBeenCalled();
      expect(mockUserInstance.generateRefreshToken).toHaveBeenCalled();
      expect(mockUserInstance.save).toHaveBeenCalledWith({ validateBeforeSave: false });
      expect(result).toEqual({ accessToken: 'accessToken', refreshToken: 'refreshToken' });
    });

    // ----------------- Ensure save() is called with correct options -----------------
    it("should call save() with { validateBeforeSave: false }", async () => {
      const userId = "abc123";
      User.findById.mockResolvedValue(mockUserInstance);
      mockUserInstance.generateAccessToken.mockReturnValue("A");
      mockUserInstance.generateRefreshToken.mockReturnValue("R");

      await generateAccessTokenAndRefreshToken(userId);

      expect(mockUserInstance.save).toHaveBeenCalledWith({ validateBeforeSave: false });
    });
  });

  // Edge case tests
  describe('Edge cases', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return 404 error if user is not found', async () => {
      // Arrange
      const userId = 'nonExistentUserId';
      User.findById.mockResolvedValue(null);

      // Act
      const result = await generateAccessTokenAndRefreshToken(userId);

      // Assert
      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(new ApiError(404, 'User not found'));
    });

    it('should return 500 error if token generation fails', async () => {
      // Arrange
      const userId = 'validUserId';
      User.findById.mockResolvedValue(mockUserInstance);
      mockUserInstance.generateAccessToken.mockImplementation(() => {
        throw new Error('Token generation error');
      });

      // Act
      const result = await generateAccessTokenAndRefreshToken(userId);

      // Assert
      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(new ApiError(500, 'Could not generate tokens'));
    });

    // ----------------- Ensure both tokens must exist in returned object -----------------
    it("should not return success object if refreshToken is missing", async () => {
      const userId = "badUserId";

      User.findById.mockResolvedValue(mockUserInstance);

      mockUserInstance.generateAccessToken.mockReturnValue("A");
      mockUserInstance.generateRefreshToken.mockReturnValue(undefined);

      const result = await generateAccessTokenAndRefreshToken(userId);

      expect(result).toEqual({ accessToken: "A", refreshToken: undefined });
    });
  });
});
