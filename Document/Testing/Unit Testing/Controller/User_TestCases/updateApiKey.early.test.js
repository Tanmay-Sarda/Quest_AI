import { User } from "../../models/User.models.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { updateApiKey } from '../user.controller.js';

// Mock the User model
jest.mock("../../models/User.models.js");

describe('updateApiKey() updateApiKey method', () => {
    let req, res, userId, apiKey;

    beforeEach(() => {
        userId = 'user123';
        apiKey = 'newApiKey123';
        req = {
            user: { _id: userId },
            body: { apiKey }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        jest.clearAllMocks();
    });

    describe('Happy paths', () => {
        it('should update the API key successfully when valid user and API key are provided', async () => {
            const mockUser = { save: jest.fn() };
            User.findById.mockResolvedValue(mockUser);

            await updateApiKey(req, res);

            //  kills mutants that change the findById argument
            expect(User.findById).toHaveBeenCalledWith(userId);

            expect(mockUser.apiKey).toBe(apiKey);
            expect(mockUser.save).toHaveBeenCalled();

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(new ApiResponse(200, {}, "API key updated successfully"));
        });
    });

    describe('Edge cases', () => {
        it('should return a 400 error if the API key is not provided', async () => {
            req.body.apiKey = undefined;

            await updateApiKey(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(new ApiError(400, "API key is required"));
        });

        it('should return a 404 error if the user is not found', async () => {
            User.findById.mockResolvedValue(null);

            await updateApiKey(req, res);

            //  ensures correct parameter tested
            expect(User.findById).toHaveBeenCalledWith(userId);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(new ApiError(404, "User not found"));
        });

        it('should handle errors during user save operation', async () => {
            const mockUser = { save: jest.fn().mockRejectedValue(new Error('Save failed')) };
            User.findById.mockResolvedValue(mockUser);

            await updateApiKey(req, res);

            // changing ID
            expect(User.findById).toHaveBeenCalledWith(userId);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(new ApiError(500, "Internal server error"));
        });
    });
});
