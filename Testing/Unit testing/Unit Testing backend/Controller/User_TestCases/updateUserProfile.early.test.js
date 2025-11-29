import { User } from "../../models/User.models.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { deleteCloudinary, uploadCloudinary } from "../../utils/cloudanary.js";
import { updateUserProfile } from '../user.controller.js';

// Mock dependencies
jest.mock("../../models/User.models.js");
jest.mock("../../utils/cloudanary.js");

describe('updateUserProfile() updateUserProfile method', () => {
  let req, res, user;

  beforeEach(() => {
    // Mock request and response objects
    req = {
      user: { _id: 'userId123' },
      body: {},
      file: null,
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock user data
    user = {
      _id: 'userId123',
      username: 'oldUsername',
      email: 'user@example.com',
      profilePicture: 'oldProfilePicUrl',
      save: jest.fn(),
    };

    // Mock User model methods
    User.findById = jest.fn().mockResolvedValue(user);
  });

  describe('Happy paths', () => {
    it('should update username and password successfully', async () => {
      // Arrange
      req.body.newUsername = 'newUsername';
      req.body.newPassword = 'newPassword';

      // Act
      await updateUserProfile(req, res);

      // Assert
      expect(User.findById).toHaveBeenCalledWith('userId123');
      expect(user.username).toBe('newUsername');
      expect(user.password).toBe('newPassword');
      expect(user.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        new ApiResponse(
          200,
          { username: 'newUsername', email: 'user@example.com', profilePicture: 'oldProfilePicUrl' },
          'Profile updated successfully.'
        )
      );
    });

    it('should update profile picture successfully', async () => {
      // Arrange
      req.file = { path: 'newProfilePicPath' };
      uploadCloudinary.mockResolvedValue({ secure_url: 'newProfilePicUrl' });

      // Act
      await updateUserProfile(req, res);

      // Assert
      expect(User.findById).toHaveBeenCalledWith('userId123');
      expect(uploadCloudinary).toHaveBeenCalledWith('newProfilePicPath');
      expect(deleteCloudinary).toHaveBeenCalledWith('oldProfilePicUrl');
      expect(user.profilePicture).toBe('newProfilePicUrl');
      expect(user.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        new ApiResponse(
          200,
          { username: 'oldUsername', email: 'user@example.com', profilePicture: 'newProfilePicUrl' },
          'Profile updated successfully.'
        )
      );
    });
  });

  describe('Edge cases', () => {
    it('should return 404 if user is not found', async () => {
      // Arrange
      User.findById.mockResolvedValue(null);

      // Act
      await updateUserProfile(req, res);

      // Assert
      expect(User.findById).toHaveBeenCalledWith('userId123');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(new ApiError(404, 'User not found.'));
    });

    it('should handle Cloudinary upload failure gracefully', async () => {
      // Arrange
      req.file = { path: 'newProfilePicPath' };
      uploadCloudinary.mockRejectedValue(new Error('Cloudinary error'));

      // Act
      await updateUserProfile(req, res);

      // Assert
      // expect(User.findById).toHaveBeenCalledWith('userId123');

      expect(uploadCloudinary).toHaveBeenCalledWith('newProfilePicPath');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(new ApiError(500, 'Failed to upload profile picture'));
    });
  });
});
