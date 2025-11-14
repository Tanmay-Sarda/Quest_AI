import asyncHandler from "../utils/AsyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

import bcrypt from "bcrypt";
import { Otp } from "../models/Otp.model.js";
import { sendOTPEmail } from "../utils/mailer.js";

// import user actions
import { registerUser, loginUser } from "./user.controller.js";

/****************************************
 * HELPER 1: Generate + Send OTP
 ****************************************/
const generateAndSendOtp = async (email) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = await bcrypt.hash(otp, 10);

  // delete old OTP for this email
  await Otp.findOneAndDelete({ email });

  // store new OTP
  await Otp.create({
    email,
    otpHash,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    attempts: 0
  });

  // send otp email
  await sendOTPEmail(email, otp);
};

/****************************************
 * HELPER 2: Verify OTP
 ****************************************/
const verifyOtp = async (email, enteredOtp) => {
  const otpEntry = await Otp.findOne({ email });

  if (!otpEntry) return { ok: false, message: "OTP not found or expired" };

  if (otpEntry.attempts >= 5) {
    await Otp.deleteOne({ email });
    return { ok: false, message: "Too many incorrect attempts. Please request a new OTP." };
  }

  if (otpEntry.expiresAt < Date.now()) {
    await Otp.deleteOne({ email });
    return { ok: false, message: "OTP expired" };
  }

  const valid = await bcrypt.compare(enteredOtp, otpEntry.otpHash);
  if (!valid) {
    otpEntry.attempts++;
    await otpEntry.save();
    return { ok: false, message: "Invalid OTP" };
  }

  // If correct, delete OTP entry
  await Otp.deleteOne({ email });
  return { ok: true };
};

/****************************************
 * SEND OTP FOR SIGNUP
 ****************************************/
export const sendSignupOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  await generateAndSendOtp(email);

  return res
    .status(200)
    .json(new ApiResponse(true, {}, "Signup OTP sent successfully"));
});

/****************************************
 * VERIFY SIGNUP OTP → CALL registerUser()
 ****************************************/
export const verifySignupOTP = asyncHandler(async (req, res) => {
  const { username, email, password, profilePicture, otp } = req.body;

  const result = await verifyOtp(email, otp);

  if (!result.ok) {
    return res.status(400).json(new ApiError(400, result.message));
  }

  // after OTP success → call registerUser()
  req.body = { username, email, password, profilePicture };
  return registerUser(req, res);
});

/****************************************
 * SEND OTP FOR LOGIN
 ****************************************/
export const sendLoginOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  await generateAndSendOtp(email);

  return res
    .status(200)
    .json(new ApiResponse(true, {}, "Login OTP sent successfully"));
});

/****************************************
 * VERIFY LOGIN OTP → CALL loginUser()
 ****************************************/
export const verifyLoginOTP = asyncHandler(async (req, res) => {
  const { email, password, otp } = req.body;

  const result = await verifyOtp(email, otp);

  if (!result.ok) {
    return res.status(400).json(new ApiError(400, result.message));
  }

  // after OTP success → call loginUser()
  req.body = { email, password };
  return loginUser(req, res);
});
