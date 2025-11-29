import { Otp } from "../../models/Otp.model.js";
import { User } from "../../models/User.models.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { resetpassword } from '../user.controller.js';

jest.mock("../../models/User.models.js");
jest.mock("../../models/Otp.model.js");

describe('resetpassword() resetpassword method', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        email: 'test@example.com',
        newPassword: 'newPassword123',
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('Happy paths', () => {
    it('should reset the password successfully when all conditions are met', async () => {
      User.findOne.mockResolvedValue({ save: jest.fn() });
      Otp.findOne.mockResolvedValue({ isVerified: true, verifiedAt: new Date() });
      Otp.deleteOne.mockResolvedValue({});

      await resetpassword(req, res);

      expect(User.findOne).toHaveBeenCalledWith({ email: req.body.email });
      expect(Otp.findOne).toHaveBeenCalledWith({ email: req.body.email });
      expect(Otp.deleteOne).toHaveBeenCalledWith({ email: req.body.email });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(new ApiResponse(true, {}, 'Password reset successfully'));
    });
  });

  describe('Edge cases', () => {
    it('should return 400 if email or newPassword is missing', async () => {
      req.body.email = null;

      await resetpassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(new ApiError(400, 'Email and new password are required'));
    });

    it('should return 404 if user is not found', async () => {
      User.findOne.mockResolvedValue(null);

      await resetpassword(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(new ApiError(404, 'User not found with this email'));
    });

    it('should return 400 if OTP is not verified', async () => {
      User.findOne.mockResolvedValue({});
      Otp.findOne.mockResolvedValue({ isVerified: false });

      await resetpassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(new ApiError(400, 'OTP verification required to reset password'));
    });

    it('should return 400 if OTP verification has expired', async () => {
      User.findOne.mockResolvedValue({});
      Otp.findOne.mockResolvedValue({
        isVerified: true,
        verifiedAt: new Date(Date.now() - 11 * 60 * 1000)
      });

      await resetpassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        new ApiError(400, 'OTP verification has expired. Please verify OTP again.')
      );
    });

    it("should NOT expire OTP if it is exactly 10 minutes old", async () => {
      User.findOne.mockResolvedValue({ save: jest.fn() });

      const tenMinutesAgo = new Date(Date.now() - 599000);


      Otp.findOne.mockResolvedValue({
        isVerified: true,
        verifiedAt: tenMinutesAgo
      });

      Otp.deleteOne.mockResolvedValue({});

      await resetpassword(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        new ApiResponse(true, {}, "Password reset successfully")
      );
    });
  });
});
