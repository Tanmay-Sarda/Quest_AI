import express from "express";
import AuthController from "../controllers/auth.controller.js";
import { resetpassword } from "../controllers/user.controller.js";

const router = express.Router();
router.post("/send-signup-otp", AuthController.sendSignupOTP);
router.post("/verify-signup-otp", AuthController.verifySignupOTP);

router.post("/send-login-otp", AuthController.sendLoginOTP);
router.post("/verify-login-otp", AuthController.verifyLoginOTP);

router.post("/forget-password/send-otp", AuthController.sendForgetPasswordOTP);
router.post("/forget-password/verify-otp", AuthController.verifyForgetPasswordOTP);

router.post("/forget-password/reset-password", resetpassword);

export default router;
