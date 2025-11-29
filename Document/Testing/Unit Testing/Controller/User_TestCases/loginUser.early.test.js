import { User } from "../../models/User.models.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { loginUser } from "../user.controller.js";
import { generateAccessTokenAndRefreshToken } from "../../middleware/token.middleware.js";

jest.mock("../../models/User.models.js");
jest.mock("../../middleware/token.middleware.js");

describe('loginUser() loginUser method', () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {
                email: 'test@example.com',
                password: 'password123',
            },
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            cookie: jest.fn().mockReturnThis(),
        };
    });

    describe('Happy Paths', () => {
        // ----------------- Successful login with valid email and password -----------------
        it("should successfully log in a user with valid credentials", async () => {
            const mockUser = {
                _id: "userId123",
                username: "testuser",
                email: "test@example.com",
                profilePicture: "profile.jpg",
                isPasswordCorrect: jest.fn().mockResolvedValue(true),
            };

            User.findOne.mockResolvedValue(mockUser);

            generateAccessTokenAndRefreshToken.mockResolvedValue({
                accessToken: "accessToken123",
                refreshToken: "refreshToken123",
            });

            await loginUser(req, res);

            expect(User.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
            expect(mockUser.isPasswordCorrect).toHaveBeenCalledWith("password123");
            expect(generateAccessTokenAndRefreshToken).toHaveBeenCalledWith("userId123");

            expect(res.status).toHaveBeenCalledWith(200);

            // ----------------- Ensure cookies are set using correct cookie options -----------------
            expect(res.cookie).toHaveBeenCalledWith(
                "accessToken",
                "accessToken123",
                expect.objectContaining({
                    httpOnly: true,
                    secure: expect.any(Boolean),
                    sameSite: "lax",
                    maxAge: 86400000,
                })
            );

            expect(res.cookie).toHaveBeenCalledWith(
                "refreshToken",
                "refreshToken123",
                expect.objectContaining({
                    httpOnly: true,
                    secure: expect.any(Boolean),
                    sameSite: "lax",
                    maxAge: 86400000,
                })
            );

            expect(res.json).toHaveBeenCalledWith(
                new ApiResponse(
                    200,
                    {
                        user: {
                            _id: "userId123",
                            username: "testuser",
                            email: "test@example.com",
                            profilePicture: "profile.jpg",
                            refreshToken: "refreshToken123",
                            accessToken: "accessToken123"
                        }
                    },
                    "Login successful"
                )
            );
        });
    });

    describe('Edge Cases', () => {
        // ----------------- User does not exist -----------------
        it('should return 404 if user is not found', async () => {
            User.findOne.mockResolvedValue(null);

            await loginUser(req, res);

            expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(new ApiError(404, 'User not found with this email'));
        });

        // ----------------- Password mismatch -----------------
        it('should return 401 if password is incorrect', async () => {
            const mockUser = {
                isPasswordCorrect: jest.fn().mockResolvedValue(false),
            };
            User.findOne.mockResolvedValue(mockUser);

            await loginUser(req, res);

            expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
            expect(mockUser.isPasswordCorrect).toHaveBeenCalledWith('password123');
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(new ApiError(401, 'Invalid password'));
        });

        // ----------------- Internal server/database error -----------------
        it('should return 500 if there is an internal server error', async () => {
            User.findOne.mockRejectedValue(new Error('Database error'));

            await loginUser(req, res);

            expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(new ApiError(500, "Internal server error"));
        });
    });
});
