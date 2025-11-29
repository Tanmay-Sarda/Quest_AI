import { User } from "../../models/User.models.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { logoutUser } from '../user.controller.js';

jest.mock("../../models/User.models.js");

describe('logoutUser() logoutUser method', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: {
        _id: 'userId123',
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('Happy Paths', () => {
    // ----------------- Successful logout when user exists -----------------
    it('should successfully log out the user and clear cookies', async () => {
      User.findByIdAndUpdate.mockResolvedValue({
        _id: 'userId123',
        username: 'testuser',
      });

      await logoutUser(req, res);

      // Ensure correct DB update call
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'userId123',
        { $unset: { refreshToken: 1 } },
        { new: true }
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.clearCookie).toHaveBeenCalledWith('accessToken', expect.any(Object));
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', expect.any(Object));
      expect(res.json).toHaveBeenCalledWith(new ApiResponse(200, {}, 'User logged out successfully'));
    });
  });

  describe('Edge Cases', () => {
    // ----------------- Handle scenario where user does not exist -----------------
    it('should handle user not found scenario gracefully', async () => {
      User.findByIdAndUpdate.mockResolvedValue(null);

      await logoutUser(req, res);

      // Ensure update call made with correct args
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'userId123',
        { $unset: { refreshToken: 1 } },
        { new: true }
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.clearCookie).toHaveBeenCalledWith('accessToken', expect.any(Object));
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', expect.any(Object));
      expect(res.json).toHaveBeenCalledWith(new ApiResponse(200, {}, 'User logged out successfully'));
    });

    // ----------------- Handle database errors during logout -----------------
    it('should handle errors during user update gracefully', async () => {
      User.findByIdAndUpdate.mockRejectedValue(new Error('Database error'));

      await logoutUser(req, res);

      // Ensure the function attempted correct update call
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'userId123',
        { $unset: { refreshToken: 1 } },
        { new: true }
      );

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(new ApiError(500, 'Internal server error'));
    });
  });
});
