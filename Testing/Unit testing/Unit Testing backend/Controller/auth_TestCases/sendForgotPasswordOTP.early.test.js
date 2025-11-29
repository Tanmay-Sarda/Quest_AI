/**
 * TEST FILE FOR sendForgotPasswordOTP()
 */

import AuthController from "../../controllers/auth.controller.js";
import { User } from "../../models/User.models.js";
import { Otp } from "../../models/Otp.model.js";
import { sendOTPEmail } from "../../utils/mailer.js";

// ==========================
// MOCK ALL DB FUNCTIONS
// ==========================
jest.mock("../../models/User.models.js", () => ({
  User: { findOne: jest.fn() },
}));

jest.mock("../../models/Otp.model.js", () => ({
  Otp: {
    findOneAndDelete: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock("../../utils/mailer.js", () => ({
  sendOTPEmail: jest.fn(),
}));

// ==========================
// HELPER: MOCK REQ/RES
// ==========================
const mockReq = (body) => ({ body });

const mockRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

const nextMock = jest.fn();

describe("sendForgotPasswordOTP() — FINAL ZOD TESTS", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // 1) Missing or invalid email handled by Zod
  // ==========================================
  it("should return 400 for missing email", async () => {
    const req = mockReq({});
    const res = mockRes();

    await AuthController.sendForgotPasswordOTP(req, res, nextMock);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
  });

  it("should return 400 for invalid email format", async () => {
    const req = mockReq({ email: "invalid_email" });
    const res = mockRes();

    await AuthController.sendForgotPasswordOTP(req, res, nextMock);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  // ==========================================
  // 2) User does NOT exist → still send success
  // ==========================================
  it("should return success even if user does NOT exist", async () => {
    User.findOne.mockResolvedValue(null);

    const req = mockReq({ email: "test@gmail.com" });
    const res = mockRes();

    await AuthController.sendForgotPasswordOTP(req, res, nextMock);

    expect(User.findOne).toHaveBeenCalledWith({ email: "test@gmail.com" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
      })
    );
  });

  // ==========================================
  // 3) User exists → should send OTP
  // ==========================================
  it("should send OTP when user exists", async () => {
    User.findOne.mockResolvedValue({ _id: "123" });

    const req = mockReq({ email: "user@gmail.com" });
    const res = mockRes();

    await AuthController.sendForgotPasswordOTP(req, res, nextMock);

    // DB operations must be triggered
    expect(User.findOne).toHaveBeenCalledWith({ email: "user@gmail.com" });
    expect(Otp.findOneAndDelete).toHaveBeenCalled();
    expect(Otp.create).toHaveBeenCalled();

    // Mailer should be triggered
    expect(sendOTPEmail).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);
  });

  // ==========================================
  // 4) Internal error → next(error)
  // ==========================================
  it("should call next(error) when exception occurs", async () => {
    const error = new Error("Internal error");
    User.findOne.mockRejectedValue(error);

    const req = mockReq({ email: "test@gmail.com" });
    const res = mockRes();

    await AuthController.sendForgotPasswordOTP(req, res, nextMock);

    expect(nextMock).toHaveBeenCalledWith(error);
  });
});
