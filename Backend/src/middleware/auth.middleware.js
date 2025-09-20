import asyncHandler from "../utils/AsyncHandler.js";
import ApiError from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/User.models.js";
//Create a middleware to verify JWT token and give the logged user details
export const verifyJWT=asyncHandler(async (req,res,next)=>{ //If anything not passed in the request, we can use underscore as a placeholder
    

    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", ""); // Get token from cookies or Authorization header

    // console.log("Token received for verification:", token); // Log the token for debugging
    if(!token){
        return res.status(401).json(new ApiError(401, "Unauthorized access, token is missing"));
    }
        const decoded= jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user=await User.findById(decoded?._id).select("-password -refreshToken") //We add id in the decoded token, so we can use it to find the user in the database
        if(!user){
             return res.status(404).json(new ApiError(404, "User not found"));
        }
        req.user=user; // Attach user details to the request object
        next(); // Call the next middleware or route handler
    }catch (error) {
        console.error(`JWT verification error: ${error.message}`);
        return res.status(401).json(new ApiError(401, "Invalid token"));
    }

})

