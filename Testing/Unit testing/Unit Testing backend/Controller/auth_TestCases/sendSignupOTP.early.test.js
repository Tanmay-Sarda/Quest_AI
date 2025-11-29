// -------------------------------------------------------
// 1) Mock mailer BEFORE importing controller
// -------------------------------------------------------
jest.mock("../../utils/mailer.js", () => ({
  sendOTPEmail: jest.fn(),
}));

// -------------------------------------------------------
// 2) Mock Models BEFORE controller import
// -------------------------------------------------------
jest.mock("../../models/Otp.model.js", () => ({
  __esModule: true,
  Otp: {
    findOneAndDelete: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock("../../models/User.models.js", () => ({
  __esModule: true,
  User: {
    findOne: jest.fn(),
  },
}));

// -------------------------------------------------------
// 3) Mock bcrypt BEFORE controller import
// -------------------------------------------------------
jest.mock("bcrypt", () => ({
  hash: jest.fn().mockResolvedValue("hashed_otp"),
}));

// -------------------------------------------------------
// 4) Import controller AFTER mocks
// -------------------------------------------------------
import AuthController from "../auth.controller.js";
const { sendSignupOTP } = AuthController;

import { sendOTPEmail } from "../../utils/mailer.js";
import { User } from "../../models/User.models.js";
import { Otp } from "../../models/Otp.model.js";
import bcrypt from "bcrypt";
import ApiResponse from "../../utils/ApiResponse.js";
import ApiError from "../../utils/ApiError.js";

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------
const reqMock = (body) => ({ body });

const resMock = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const nextMock = jest.fn();

// -------------------------------------------------------
// TESTS
// -------------------------------------------------------
describe("sendSignupOTP() with backend validation", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should return 400 if email is missing", async () => {
    const req = reqMock({});
    const res = resMock();

    await sendSignupOTP(req, res, nextMock);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should return 400 if email is empty", async () => {
    const req = reqMock({ email: "" });
    const res = resMock();

    await sendSignupOTP(req, res, nextMock);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should return 400 if email is not a string", async () => {
    const req = reqMock({ email: 12345 });
    const res = resMock();

    await sendSignupOTP(req, res, nextMock);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should return 400 for invalid email format", async () => {
    const req = reqMock({ email: "invalid-email" });
    const res = resMock();

    await sendSignupOTP(req, res, nextMock);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should return 409 if user already exists", async () => {
    User.findOne.mockResolvedValue({ id: 1 });

    const req = reqMock({ email: "test@gmail.com" });
    const res = resMock();

    await sendSignupOTP(req, res, nextMock);

    expect(User.findOne).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it("should send OTP for a valid email", async () => {
    User.findOne.mockResolvedValue(null);

    Otp.findOneAndDelete.mockResolvedValue({});
    Otp.create.mockResolvedValue({});
    sendOTPEmail.mockResolvedValue(true);

    const req = reqMock({ email: "ValidEmail@Gmail.com" });
    const res = resMock();

    await sendSignupOTP(req, res, nextMock);

    expect(User.findOne).toHaveBeenCalledWith({
      email: "validemail@gmail.com",
    });

    expect(Otp.create).toHaveBeenCalled();
    expect(sendOTPEmail).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      new ApiResponse(true, {}, "Signup OTP sent successfully")
    );
  });

  it("should call next(error) when DB throws", async () => {
    const error = new Error("DB error");
    User.findOne.mockRejectedValue(error);

    const req = reqMock({ email: "test@gmail.com" });
    const res = resMock();

    await sendSignupOTP(req, res, nextMock);

    expect(nextMock).toHaveBeenCalledWith(error);
  });
});
