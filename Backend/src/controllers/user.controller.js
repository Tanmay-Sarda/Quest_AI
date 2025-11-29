import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/AsyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import { User } from "../models/User.models.js";
import { OAuth2Client } from "google-auth-library";
import { Otp } from "../models/Otp.model.js";
import crypto from "crypto";
import { uploadCloudinary, deleteCloudinary } from "../utils/cloudanary.js";
import { generateAccessTokenAndRefreshToken } from "../middleware/token.middleware.js";
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);




const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (username === "" || password === "" || email === "") {
            return res
                .status(408)
                .json(new ApiError(408, 'Required username,password and email'));
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res
                .status(409)
                .json(new ApiError(409, 'User already exists with this email'));
        }

        // Create user
        const newUser = new User({ username, email, password });

        await newUser.save();

        res.status(201).json(
            new ApiResponse(
                201,
                { _id: newUser._id, username: newUser.username, email: newUser.email },
                'User registered successfully'
            )
        );
    } catch (error) {
        return res.status(500).json(new ApiError(500, "Could not register user"))
    }
};


const googleLogin = async (req, res) => {
    try {
        const { token } = req.body; // token from frontend Google sign-in

        // Verify the token with Google
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, name, profilePicture } = payload;

        // Check if user already exists
        let user = await User.findOne({ email });

        if (!user) {
            const randomPassword = crypto.randomBytes(16).toString("hex");
            user = await User.create({
                username: name,
                email,
                password: randomPassword, // dummy password
            });
        }

        // Generate tokens
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        if (profilePicture) {
            user.profilePicture = profilePicture
        }
        // Save tokens to DB
        user.accesstoken = accessToken;
        user.refreshtoken = refreshToken;
        await user.save();

        // Set tokens in HTTP-only cookies
        const cookieOptions = {
            //httpOnly and secure options use because this change only in production not in development(frontend cannot access the cookie)
            httpOnly: true, // Prevents client-side access to the cookie 
            secure: true, // Use secure cookies in production (HTTPS)
        }

        res
            .status(200)
            .cookie("accessToken", accessToken, cookieOptions) // Set access token in HTTP-only cookie
            .cookie("refreshToken", refreshToken, cookieOptions) // Set refresh token in HTTP-only cookie
            .json(new ApiResponse(true, { user: { _id: user._id, username: user.username, email: user.email, profilePicture: user.profilePicture, refreshToken, accessToken } }, 'Google login successful'));
    } catch (error) {
        res.status(500).json(new ApiError(500, 'Google login failed'));
    }
}

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json(new ApiError(404, 'User not found with this email'));
        }
        // Check if password is correct
        const isPasswordValid = await user.isPasswordCorrect(password);
        if (!isPasswordValid) {
            return res.status(401).json(new ApiError(401, 'Invalid password'));
        }
        // Generate tokens
        const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id);

        // Set tokens in HTTP-only cookies
        const cookieOptions = {
            //httpOnly and secure options use because this change only in production not in development(frontend cannot access the cookie)
            httpOnly: true,// Prevents client-side access to the cookie 
            secure: process.env.NODE_ENV === "production", // Use secure cookies in production (HTTPS)
            sameSite: "lax",
            maxAge: 86400000, // 1 day
        }
        return res.
            status(200).
            cookie("accessToken", accessToken, cookieOptions).
            cookie("refreshToken", refreshToken, cookieOptions). // Set refresh token with a longer expiry (30 days)
            json(new ApiResponse(200, { user: { _id: user._id, username: user.username, email: user.email, profilePicture: user.profilePicture, refreshToken, accessToken } }, 'Login successful'));
    } catch (err) {
        res.status(500).json(new ApiError(500, 'Internal server error'));
    }
};

const logoutUser = async (req, res) => {
    //Clear the refresh token from the user document
    try {
        const user = await User.findByIdAndUpdate(req.user._id, {
            $unset: { refreshToken: 1 } // unSet refreshToken
        }, {
            new: true, // Return the updated user document
        })

        const cookieOptions = {
            //httpOnly and secure options use because this change only in production not in development(frontend cannot access the cookie)
            httpOnly: true, // Prevents client-side access to the cookie 
            secure: process.env.NODE_ENV === "production", // Use secure cookies in production (HTTPS)
            sameSite: "lax",
        }
        return res.
            status(200).
            clearCookie("accessToken", cookieOptions). // Clear the access token cookie
            clearCookie("refreshToken", cookieOptions). // Clear the refresh token cookie
            json(new ApiResponse(200, {}, "User logged out successfully"));
    } catch (err) {
        res.status(500).json(new ApiError(500, 'Internal server error'));
    }
}
    ;


const updateUserProfile = async (req, res) => {
    const userId = req.user._id; // From verifyJWT middleware
    const { newUsername, newPassword } = req.body;

    // If a new profile picture is uploaded, handle the upload to Cloudinary  
    if (req.file) {
        try {
            // Upload new profile picture to Cloudinary
            const uploadResult = await uploadCloudinary(req.file.path);
            // Delete old profile picture from Cloudinary if it exists
            const user = await User.findById(userId);
            if (user.profilePicture) {
                await deleteCloudinary(user.profilePicture);
            }
            // Update user's profile picture URL
            user.profilePicture = uploadResult.secure_url;
            await user.save();
        } catch (error) {
            return res.status(500).json(new ApiError(500, "Failed to upload profile picture"));
        }
    }


    //  Find the user
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json(new ApiError(404, "User not found."));
    }

    //  Update fields conditionally
    if (newUsername) user.username = newUsername;
    if (newPassword) user.password = newPassword;
    //  Save the user
    await user.save();

    res.status(200).json(new ApiResponse(200, { username: user.username, email: user.email, profilePicture: user.profilePicture }, "Profile updated successfully."));
};

const updateApiKey = async (req, res) => {
    try {
        const userId = req.user._id;
        const { apiKey } = req.body;

        if (!apiKey) {
            return res.status(400).json(new ApiError(400, "API key is required"));
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json(new ApiError(404, "User not found"));
        }

        user.apiKey = apiKey;
        await user.save();

        res.status(200).json(new ApiResponse(200, {}, "API key updated successfully"));
    } catch (error) {
        return res.status(500).json(new ApiError(500, "Internal server error"))
    }
};

const resetpassword = async (req, res) => {
    const { email, newPassword } = req.body;
    // Find the user by email
    if (!email || !newPassword) {
        return res.status(400).json(new ApiError(400, 'Email and new password are required'));
    }

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json(new ApiError(404, 'User not found with this email'));
    }

    const otpRecord = await Otp.findOne({ email });
    if (!otpRecord || !otpRecord.isVerified) {
        return res.status(400).json(new ApiError(400, 'OTP verification required to reset password'));
    }

    if (Date.now() - otpRecord.verifiedAt.getTime() > 600000) {
        return res.status(400).json(new ApiError(400, 'OTP verification has expired. Please verify OTP again.'));
    }

    // Update the user's password
    user.password = newPassword;
    await user.save();

    await Otp.deleteOne({ email });

    res.status(200).json(new ApiResponse(true, {}, 'Password reset successfully'));
};

export { registerUser, loginUser, logoutUser, googleLogin, updateUserProfile, resetpassword, updateApiKey };