import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true, unique: true },
  otpHash: { type: String, required: true },   // hashed OTP
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  verifiedAt: { type: Date, default: null }
}, { timestamps: true });

export const Otp = mongoose.models.Otp || mongoose.model("Otp", otpSchema);
