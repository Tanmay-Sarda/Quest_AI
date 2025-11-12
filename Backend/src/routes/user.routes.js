import { registerUser, loginUser, logoutUser, generateRefreshToken,googleLogin ,  updateUserProfile } from "../controllers/user.controller.js";
import  { Router } from 'express';
const router = Router();
import { verifyJWT } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
//Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.route('/refresh-token').get(generateRefreshToken); //Using route.route to chain multiple methods
router.route('/logout').post(verifyJWT, logoutUser); //Protected route, user must be logged in to logout
router.post("/google-login", googleLogin);
router.patch("/update-profile",verifyJWT,upload.single('profileImage'), updateUserProfile); // Protected route to update user profile

export default router;