/**
 * verifyLoginOTP.early.test.js
 * - Mocks mailer BEFORE importing controller (prevents Brevo crash)
 * - Mocks user.controller, Otp model, bcrypt
 * - Tests: success, invalid OTP, internal error, loginUser throws
 */

// 1) MUST mock mailer BEFORE importing controller (prevents Brevo init)
jest.mock("../../utils/mailer.js", () => ({
  sendOTPEmail: jest.fn(),
}));

// 2) mock user.controller BEFORE importing controller
jest.mock("../user.controller.js", () => ({
  registerUser: jest.fn(),
  loginUser: jest.fn(),
}));

// 3) mock Otp model BEFORE importing controller
jest.mock("../../models/Otp.model.js", () => ({
  Otp: {
    findOne: jest.fn(),
    deleteOne: jest.fn(),
    create: jest.fn(),
    findOneAndDelete: jest.fn(),
  },
}));

// 4) mock bcrypt BEFORE importing controller
jest.mock("bcrypt", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

// 5) Now import controller and the mocked funcs/objects
import AuthController from "../auth.controller.js";
import { loginUser } from "../user.controller.js";
import { Otp } from "../../models/Otp.model.js";
import bcrypt from "bcrypt";

// Helper factories
const mockReq = (body = {}) => ({ body });
const mockRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};
const nextMock = jest.fn();

describe("verifyLoginOTP() — FINAL", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call loginUser when OTP is valid", async () => {
    // Arrange: Otp entry exists and bcrypt returns true
    Otp.findOne.mockResolvedValue({
      otpHash: "hashed",
      attempts: 0,
      expiresAt: Date.now() + 5_000,
      save: jest.fn(),
    });
    bcrypt.compare.mockResolvedValue(true);

    // loginUser returns 200 response when called by controller
    loginUser.mockImplementation((req, res) => res.status(200).json({ ok: true }));

    const req = mockReq({
      email: "test@gmail.com",
      password: "secret",
      otp: "111111",
    });
    const res = mockRes();

    // Act
    await AuthController.verifyLoginOTP(req, res, nextMock);

    // Assert
    expect(Otp.findOne).toHaveBeenCalled();
    expect(bcrypt.compare).toHaveBeenCalled();
    expect(loginUser).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should return 400 when OTP invalid", async () => {
    Otp.findOne.mockResolvedValue({
      otpHash: "hashed",
      attempts: 0,
      expiresAt: Date.now() + 5_000,
      save: jest.fn(),
    });
    bcrypt.compare.mockResolvedValue(false); // invalid

    const req = mockReq({
      email: "test@gmail.com",
      password: "secret",
      otp: "000000",
    });
    const res = mockRes();

    await AuthController.verifyLoginOTP(req, res, nextMock);

    expect(Otp.findOne).toHaveBeenCalled();
    expect(bcrypt.compare).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should call next(error) when internal DB/verify logic throws", async () => {
    const error = new Error("internal DB fail");
    // Simulate Otp.findOne throwing (this simulates verifyOtp internal failure)
    Otp.findOne.mockImplementation(() => {
      throw error;
    });

    const req = mockReq({
      email: "test@gmail.com",
      password: "secret",
      otp: "222222",
    });
    const res = mockRes();

    await AuthController.verifyLoginOTP(req, res, nextMock);

    expect(nextMock).toHaveBeenCalledWith(error);
  });

  it("should call next(error) when loginUser throws", async () => {
    const error = new Error("loginUser failed");

    // valid OTP flow
    Otp.findOne.mockResolvedValue({
      otpHash: "hashed",
      attempts: 0,
      expiresAt: Date.now() + 5_000,
      save: jest.fn(),
    });
    bcrypt.compare.mockResolvedValue(true);

    // make loginUser throw
    loginUser.mockImplementation(() => {
      throw error;
    });

    const req = mockReq({
      email: "test@gmail.com",
      password: "secret",
      otp: "333333",
    });
    const res = mockRes();

    await AuthController.verifyLoginOTP(req, res, nextMock);

    expect(nextMock).toHaveBeenCalledWith(error);
  });
});
