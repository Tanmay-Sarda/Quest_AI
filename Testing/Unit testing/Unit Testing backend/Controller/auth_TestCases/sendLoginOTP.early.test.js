/**
 * sendLoginOTP.early.test.js
 * Matches your controller behavior: do NOT change controller; adjust tests.
 */

// 1) Mock mailer BEFORE importing controller
jest.mock("../../utils/mailer.js", () => ({
  sendOTPEmail: jest.fn(),
}));

// 2) Mock Otp model BEFORE import
jest.mock("../../models/Otp.model.js", () => ({
  Otp: {
    findOneAndDelete: jest.fn(),
    create: jest.fn(),
  },
}));

// 3) Mock bcrypt BEFORE import (hash might be used in generate)
jest.mock("bcrypt", () => ({
  hash: jest.fn().mockResolvedValue("hashed_otp"),
}));

// 4) Mock validation schema BEFORE import (zod-like safeParse)
jest.mock("../../validations/auth.validation.js", () => ({
  emailSchema: {
    safeParse: jest.fn((data) => {
      // minimal behaviour: require email string with '@'
      if (!data || !data.email) {
        return { success: false, error: { issues: [{ message: "Email is required" }] } };
      }
      if (typeof data.email !== "string" || !data.email.includes("@")) {
        return { success: false, error: { issues: [{ message: "Invalid email format" }] } };
      }
      // return normalized email (controller expects normalized later maybe)
      return { success: true, data: { email: data.email } };
    }),
  },
}));

// 5) Now import controller after mocks
import AuthController from "../auth.controller.js";
import { Otp } from "../../models/Otp.model.js";
import { sendOTPEmail } from "../../utils/mailer.js";

// Helpers
const mockReq = (body = {}) => ({ body });
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};
const nextMock = jest.fn();

describe("sendLoginOTP() TEST SUITE", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 400 if email missing", async () => {
    const req = mockReq({});
    const res = mockRes();

    await AuthController.sendLoginOTP(req, res, nextMock);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should return 400 for invalid email format", async () => {
    const req = mockReq({ email: "not-an-email" });
    const res = mockRes();

    await AuthController.sendLoginOTP(req, res, nextMock);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  // Controller intentionally doesn't check user existence for security.
  // So both "user not found" and "user exists" paths produce same outward response (200).
  it("should send OTP even if user not found (security) — returns 200", async () => {
    // Simulate DB actions succeeding
    Otp.findOneAndDelete.mockResolvedValue({});
    Otp.create.mockResolvedValue({});
    sendOTPEmail.mockResolvedValue(true);

    const req = mockReq({ email: "missinguser@gmail.com" });
    const res = mockRes();

    await AuthController.sendLoginOTP(req, res, nextMock);

    expect(Otp.findOneAndDelete).toHaveBeenCalled();
    expect(Otp.create).toHaveBeenCalled();
    expect(sendOTPEmail).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should send OTP when user exists (normal) — returns 200", async () => {
    Otp.findOneAndDelete.mockResolvedValue({});
    Otp.create.mockResolvedValue({});
    sendOTPEmail.mockResolvedValue(true);

    const req = mockReq({ email: "test@gmail.com" });
    const res = mockRes();

    await AuthController.sendLoginOTP(req, res, nextMock);

    expect(sendOTPEmail).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should call next(error) when DB throws", async () => {
    const error = new Error("DB error");
    // Make DB operation throw (simulate failure in findOneAndDelete)
    Otp.findOneAndDelete.mockRejectedValue(error);

    const req = mockReq({ email: "test@gmail.com" });
    const res = mockRes();

    await AuthController.sendLoginOTP(req, res, nextMock);

    expect(nextMock).toHaveBeenCalledWith(error);
  });
});
