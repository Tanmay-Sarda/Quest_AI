import mongoose from "mongoose";
import jwt from 'jsonwebtoken';
import bcrpt from 'bcrypt';
const userSchema = new mongoose.Schema(
    {
        username: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        profilePicture: { type: String, default: "https://i.pinimg.com/736x/39/8f/da/398fdab4318b3baa65d36baf5ab3fab4.jpg" },
        accesstoken:{type:String},
        refreshtoken:{type:String},
        apiKey: { type: String }
    },{ timestamps: true }
)

userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrpt.hash(this.password, 10);
    }
    next();
});

//Create Own methods from hooks
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrpt.compare(password, this.password);
}

userSchema.methods.isApiKeyCorrect = async function (apiKey) {
    return await bcrpt.compare(apiKey, this.apiKey);
}

//Generate  Access Token
userSchema.methods.generateAccessToken = function () {
    return jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
    }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    });
}

//Generate Refresh Token
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );
}



export const User = mongoose.model("User", userSchema);