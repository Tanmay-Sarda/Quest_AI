import express from "express";
import { 
  sendSignupOTP,
  verifySignupOTP,
  sendLoginOTP,
  verifyLoginOTP
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/send-signup-otp", sendSignupOTP);
router.post("/verify-signup-otp", verifySignupOTP);

router.post("/send-login-otp", sendLoginOTP);
router.post("/verify-login-otp", verifyLoginOTP);

export default router;
