import express from "express";
import { 
  sendSignupOTP,
  verifySignupOTP,
  sendLoginOTP,
  verifyLoginOTP,
  sendForgotPasswordOTP,
  verifyForgotPasswordOTP
} from "../controllers/auth.controller.js";
import { resetpassword } from "../controllers/user.controller.js";

const router = express.Router();

router.post("/send-signup-otp", sendSignupOTP);
router.post("/verify-signup-otp", verifySignupOTP);

router.post("/send-login-otp", sendLoginOTP);
router.post("/verify-login-otp", verifyLoginOTP);

router.post("/forget-password/send-otp", sendForgotPasswordOTP);
router.post("/forget-password/verify-otp", verifyForgotPasswordOTP);
router.post("/forget-password/reset-password", resetpassword);

export default router;
