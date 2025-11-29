/**
 * COMPLETELY FIXED TEST FILE FOR verifySignupOTP()
 */

// -------------------------------------------------------
// 1) MOCK EVERYTHING FIRST
// -------------------------------------------------------
jest.mock("../../utils/mailer.js", () => ({
  sendOTPEmail: jest.fn(),
}));

// Mock user controller
jest.mock("../user.controller.js", () => ({
  __esModule: true,
  registerUser: jest.fn((req, res) => res.status(201).json({ success: true })),
  loginUser: jest.fn(),
}));

// Mock models
jest.mock("../../models/Otp.model.js", () => ({
  __esModule: true,
  Otp: {
    findOne: jest.fn(),
    deleteOne: jest.fn(),
    findOneAndDelete: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock("../../models/User.models.js", () => ({
  __esModule: true,
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock("bcrypt", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

// -------------------------------------------------------
// 2) IMPORTS AFTER MOCKS
// -------------------------------------------------------
import AuthController from "../auth.controller.js";
import { registerUser } from "../user.controller.js";
import { Otp } from "../../models/Otp.model.js";
import { User } from "../../models/User.models.js";
import bcrypt from "bcrypt";

// -------------------------------------------------------
// 3) TEST SETUP
// -------------------------------------------------------
const mockReq = (body = {}) => ({ body });

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const nextMock = jest.fn();

// -------------------------------------------------------
// 4) TEST SUITE - FIXED VERSION
// -------------------------------------------------------
describe("verifySignupOTP() — COMPLETELY FIXED", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset ALL mocks to avoid interference between tests
    Otp.findOne.mockReset();
    User.findOne.mockReset();
    bcrypt.compare.mockReset();
    registerUser.mockReset();
    
    // Default mock for User.findOne - user doesn't exist
    User.findOne.mockResolvedValue(null);
  });

  // -----------------------------------------------------
  // VALID OTP — should call registerUser
  // -----------------------------------------------------
  it("should register user when OTP is valid", async () => {
    // mock DB OTP record
    Otp.findOne.mockResolvedValue({
      otpHash: "hash123",
      attempts: 0,
      expiresAt: Date.now() + 50000,
      save: jest.fn(),
    });

    bcrypt.compare.mockResolvedValue(true);

    // mock registerUser success
    registerUser.mockImplementation((req, res) =>
      res.status(201).json({ success: true })
    );

    const req = mockReq({
      username: "John",
      email: "john@gmail.com",
      password: "secret",
      otp: "111111",
    });

    const res = mockRes();

    await AuthController.verifySignupOTP(req, res, nextMock);

    expect(Otp.findOne).toHaveBeenCalledTimes(1);
    expect(registerUser).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(201);
  });


  // -----------------------------------------------------
  // TEST 2: Invalid OTP - FIXED
  // -----------------------------------------------------
  it("should return 400 when OTP is invalid", async () => {
    // Setup OTP mock
    Otp.findOne.mockResolvedValue({
      otpHash: "hash000",
      attempts: 0,
      expiresAt: Date.now() + 50000,
      save: jest.fn(),
    });

    bcrypt.compare.mockResolvedValue(false);

    const req = mockReq({
      username: "John",
      email: "john@gmail.com",
      password: "secret",
      otp: "999999",
    });

    const res = mockRes();

    await AuthController.verifySignupOTP(req, res, nextMock);

    // Debug: Check what was actually called
    console.log('Otp.findOne calls:', Otp.findOne.mock.calls.length);
    console.log('bcrypt.compare calls:', bcrypt.compare.mock.calls.length);
    console.log('res.status calls:', res.status.mock.calls);
    console.log('res.json calls:', res.json.mock.calls);

    expect(Otp.findOne).toHaveBeenCalledTimes(1);
    expect(bcrypt.compare).toHaveBeenCalledWith("999999", "hash000");
    expect(registerUser).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  // -----------------------------------------------------
  // TEST 3: No OTP record - FIXED
  // -----------------------------------------------------
  it("should return 400 when no OTP record is found", async () => {
    // Setup OTP mock to return null
    Otp.findOne.mockResolvedValue(null);

    const req = mockReq({
      username: "John",
      email: "john@gmail.com",
      password: "secret",
      otp: "999999",
    });

    const res = mockRes();

    await AuthController.verifySignupOTP(req, res, nextMock);

    expect(Otp.findOne).toHaveBeenCalledTimes(1);
    expect(bcrypt.compare).not.toHaveBeenCalled();
    expect(registerUser).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  }); 
});