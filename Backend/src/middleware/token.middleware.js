import { User } from "../models/User.models.js";

export const generateAccessTokenAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);

        if (!user) {
            return new ApiError(404, "User not found");
        }

        try {
            const accessToken = user.generateAccessToken();
            const refreshToken = user.generateRefreshToken();

            user.refreshtoken = refreshToken;
            user.accesstoken = accessToken;

            await user.save({ validateBeforeSave: false });

            return { accessToken, refreshToken };
        } catch (err) {
            return new ApiError(500, "Could not generate tokens");
        }
    } catch (err) {
        return new ApiError(500, "Could not register user");
    }
};

