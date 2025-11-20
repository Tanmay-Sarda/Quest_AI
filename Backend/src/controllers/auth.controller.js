import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

import { User } from "../models/User.models.js";
import { Otp } from "../models/Otp.model.js";

import bcrypt from "bcrypt";
import { sendOTPEmail } from "../utils/mailer.js";
import { registerUser, loginUser } from "./user.controller.js";

import {
  emailSchema,
  signupVerifySchema,
  loginVerifySchema,
  forgotVerifySchema,
} from "../validations/auth.validation.js";
import e from "express";

/****************************************
 * HELPER 1 — Generate + Send OTP
 ****************************************/
const generateAndSendOtp = async (email) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = await bcrypt.hash(otp, 10);

  await Otp.findOneAndDelete({ email });

  await Otp.create({
    email,
    otpHash,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 min
    attempts: 0,
  });

  await sendOTPEmail(email, otp);
};

/****************************************
 * HELPER 2 — Verify OTP
 ****************************************/
const verifyOtp = async (email, enteredOtp) => {
  const otpEntry = await Otp.findOne({ email });

  if (!otpEntry)
    return { ok: false, message: "OTP not found or expired" };

  if (otpEntry.attempts >= 5) {
    await Otp.deleteOne({ email });
    return {
      ok: false,
      message: "Too many incorrect attempts. Please request a new OTP.",
    };
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

  await Otp.deleteOne({ email });
  return { ok: true };
};

/****************************************
 * SEND SIGNUP OTP
 ****************************************/
const sendSignupOTP = async (req, res, next) => {
  try {
    const parsed = emailSchema.safeParse(req.body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return res.status(400).json(new ApiError(400, issue.message));
    }

     const email = parsed.data.email.toLowerCase();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json(new ApiError(409, "User already exists with this email"));
    }

    await generateAndSendOtp(email);

    return res.status(200).json(
      new ApiResponse(true, {}, "Signup OTP sent successfully")
    );
  } catch (error) {
    next(error);
  }
};

/****************************************
 * VERIFY SIGNUP OTP
 ****************************************/
const verifySignupOTP = async (req, res, next) => {
  try {
    const parsed = signupVerifySchema.safeParse(req.body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return res.status(400).json(new ApiError(400, issue.message));
    }

    let { username, email, password, profilePicture, otp } = parsed.data;
    email = email.toLowerCase();

    const result = await verifyOtp(email, otp);
    if (!result.ok) {
      return res.status(400).json(new ApiError(400, result.message));
    }

    req.body = { username, email, password, profilePicture };
    return registerUser(req, res, next);
  } catch (error) {
    next(error);
  }
};

/****************************************
 * SEND LOGIN OTP
 ****************************************/
const sendLoginOTP = async (req, res, next) => {
  try {
    const parsed = emailSchema.safeParse(req.body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return res.status(400).json(new ApiError(400, issue.message));
    }

    const email = parsed.data.email.toLowerCase();
    await generateAndSendOtp(email);

    return res.status(200).json(
      new ApiResponse(true, {}, "Login OTP sent successfully")
    );
  } catch (error) {
    next(error);
  }
};

/****************************************
 * VERIFY LOGIN OTP
 ****************************************/
const verifyLoginOTP = async (req, res, next) => {
  try {
    const parsed = loginVerifySchema.safeParse(req.body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return res.status(400).json(new ApiError(400, issue.message));
    }

    let { email, password, otp } = parsed.data;
    email = email.toLowerCase();

    const result = await verifyOtp(email, otp);
    if (!result.ok) {
      return res.status(400).json(new ApiError(400, result.message));
    }

    req.body = { email, password };
    return loginUser(req, res, next);
  } catch (error) {
    next(error);
  }
};

/****************************************
 * SEND FORGOT PASSWORD OTP
 ****************************************/
const sendForgetPasswordOTP = async (req, res, next) => {
  try {
    const parsed = emailSchema.safeParse(req.body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return res.status(400).json(new ApiError(400, issue.message));
    }

    const email = parsed.data.email.toLowerCase();
    const user = await User.findOne({ email });

    // Return same response for security
    if (!user) {
      return res
        .status(200)
        .json(new ApiResponse(true, {}, "OTP has been sent"));
    }

    await generateAndSendOtp(email);

    return res
      .status(200)
      .json(new ApiResponse(true, {}, "OTP has been sent"));
  } catch (error) {
    next(error);
  }
};

/****************************************
 * VERIFY FORGOT PASSWORD OTP
 ****************************************/
const verifyForgetPasswordOTP = async (req, res, next) => {
  try {
    const parsed = forgotVerifySchema.safeParse(req.body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return res.status(400).json(new ApiError(400, issue.message));
    }

    let { email, otp } = parsed.data;
    email = email.toLowerCase();

    const otpEntry = await Otp.findOne({ email });

    if (!otpEntry)
      return res
        .status(400)
        .json(new ApiError(400, "OTP not found or expired"));

    if (otpEntry.attempts >= 5) {
      await Otp.deleteOne({ email });
      return res.status(400).json(
        new ApiError(
          400,
          "Too many incorrect attempts. Please request a new OTP."
        )
      );
    }

    if (otpEntry.expiresAt < Date.now()) {
      await Otp.deleteOne({ email });
      return res.status(400).json(new ApiError(400, "OTP expired"));
    }

    const valid = await bcrypt.compare(otp, otpEntry.otpHash);
    if (!valid) {
      otpEntry.attempts++;
      await otpEntry.save();
      return res.status(400).json(new ApiError(400, "Invalid OTP"));
    }

    otpEntry.isVerified = true;
    otpEntry.verifiedAt = Date.now();
    await otpEntry.save();

    return res.status(200).json(
      new ApiResponse(true, { email }, "OTP verified successfully")
    );
  } catch (error) {
    next(error);
  }
};

const AuthController = {
  sendSignupOTP,
  verifySignupOTP,
  verifyOtp,
  sendLoginOTP,
  verifyLoginOTP,
  sendForgetPasswordOTP,
  verifyForgetPasswordOTP,
};

export default AuthController;