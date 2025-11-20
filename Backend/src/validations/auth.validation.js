import { z } from "zod";

export const emailSchema = z.object({
  email: z.string().trim().email("Invalid email format"),
});

export const signupVerifySchema = z.object({
  username: z.string().trim().min(1, "Username required"),
  email: z.string().trim().email("Invalid email format"),
  password: z.string().min(6, "Password too short"),
  profilePicture: z.string().optional(),
  otp: z.string().trim().length(6, "OTP must be 6 digits"),
});

export const loginVerifySchema = z.object({
  email: z.string().trim().email("Invalid email format"),
  password: z.string().min(1),
  otp: z.string().trim().length(6, "OTP must be 6 digits"),
});

export const forgotVerifySchema = z.object({
  email: z.string().trim().email("Invalid email format"),
  otp: z.string().trim().length(6, "OTP must be 6 digits"),
});