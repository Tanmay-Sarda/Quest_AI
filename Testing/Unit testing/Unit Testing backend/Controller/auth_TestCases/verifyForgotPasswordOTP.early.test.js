// Mock validation so it returns the SAME email & otp passed in req.body
jest.mock("../../validations/auth.validation.js", () => ({
  forgotVerifySchema: {
    safeParse: jest.fn((input) => ({
      success: true,
      data: input, // <-- THE FIX (return same email/otp)
    })),
  },
  emailSchema: { safeParse: jest.fn(() => ({ success: true, data: {} })) },
  signupVerifySchema: { safeParse: jest.fn(() => ({ success: true, data: {} })) },
  loginVerifySchema: { safeParse: jest.fn(() => ({ success: true, data: {} })) },
}));

// Mock mailer
jest.mock("../../utils/mailer.js", () => ({
  sendOTPEmail: jest.fn(),
}));

// Mock ApiError/ApiResponse
jest.mock("../../utils/ApiError.js");
jest.mock("../../utils/ApiResponse.js");

// Mock DB + bcrypt
jest.mock("../../models/Otp.model.js", () => ({
  Otp: {
    findOne: jest.fn(),
    deleteOne: jest.fn(),
  },
}));

jest.mock("bcrypt", () => ({
  compare: jest.fn(),
}));

// IMPORTS AFTER MOCKS
import AuthController from "../auth.controller.js";
import { Otp } from "../../models/Otp.model.js";
import bcrypt from "bcrypt";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";

// req/res mocks
const mockReq = (body) => ({ body });

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const nextMock = jest.fn();

describe("verifyForgotPasswordOTP() — FINAL FIXED TESTS", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 if OTP entry not found", async () => {
    Otp.findOne.mockResolvedValue(null);

    const req = mockReq({ email: "test@gmail.com", otp: "111111" });
    const res = mockRes();

    await AuthController.verifyForgotPasswordOTP(req, res, nextMock);

    expect(Otp.findOne).toHaveBeenCalledWith({ email: "test@gmail.com" });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(ApiError).toHaveBeenCalledWith(400, "OTP not found or expired");
  });

  it("should return 400 if too many attempts", async () => {
    Otp.findOne.mockResolvedValue({
      attempts: 5,
      expiresAt: Date.now() + 50000,
    });

    const req = mockReq({ email: "test@gmail.com", otp: "111111" });
    const res = mockRes();

    await AuthController.verifyForgotPasswordOTP(req, res, nextMock);

    expect(Otp.deleteOne).toHaveBeenCalledWith({ email: "test@gmail.com" });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(ApiError).toHaveBeenCalledWith(
      400,
      "Too many incorrect attempts. Please request a new OTP."
    );
  });

  it("should return 400 if OTP expired", async () => {
    Otp.findOne.mockResolvedValue({
      attempts: 0,
      expiresAt: Date.now() - 50000,
    });

    const req = mockReq({ email: "test@gmail.com", otp: "111111" });
    const res = mockRes();

    await AuthController.verifyForgotPasswordOTP(req, res, nextMock);

    expect(Otp.deleteOne).toHaveBeenCalledWith({ email: "test@gmail.com" });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(ApiError).toHaveBeenCalledWith(400, "OTP expired");
  });

  it("should return 400 for invalid OTP", async () => {
    const record = {
      attempts: 0,
      expiresAt: Date.now() + 50000,
      otpHash: "hash",
      save: jest.fn(),
    };

    Otp.findOne.mockResolvedValue(record);
    bcrypt.compare.mockResolvedValue(false);

    const req = mockReq({ email: "test@gmail.com", otp: "wrong" });
    const res = mockRes();

    await AuthController.verifyForgotPasswordOTP(req, res, nextMock);

    expect(bcrypt.compare).toHaveBeenCalled();
    expect(record.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(ApiError).toHaveBeenCalledWith(400, "Invalid OTP");
  });

  it("should return 200 when OTP is valid", async () => {
    const record = {
      attempts: 0,
      expiresAt: Date.now() + 50000,
      otpHash: "hash",
      save: jest.fn(),
    };

    Otp.findOne.mockResolvedValue(record);
    bcrypt.compare.mockResolvedValue(true);

    const req = mockReq({ email: "test@gmail.com", otp: "111111" });
    const res = mockRes();

    await AuthController.verifyForgotPasswordOTP(req, res, nextMock);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(ApiResponse).toHaveBeenCalledWith(
      true,
      { email: "test@gmail.com" },
      "OTP verified successfully"
    );
  });

  it("should call next(error) if DB fails", async () => {
    const error = new Error("DB failed");
    Otp.findOne.mockRejectedValue(error);

    const req = mockReq({ email: "test@gmail.com", otp: "111111" });
    const res = mockRes();

    await AuthController.verifyForgotPasswordOTP(req, res, nextMock);

    expect(nextMock).toHaveBeenCalledWith(error);
  });
});
