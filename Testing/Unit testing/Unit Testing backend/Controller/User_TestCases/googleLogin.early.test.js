// Mock setup must come before imports
jest.mock("google-auth-library", () => {
  const mockVerifyIdToken = jest.fn();
  return {
    OAuth2Client: jest.fn(() => ({
      verifyIdToken: mockVerifyIdToken
    })),
    __mockVerifyIdToken: mockVerifyIdToken
  };
});

jest.mock("../../models/User.models.js", () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn()
  }
}));

jest.mock("crypto", () => ({
  randomBytes: jest.fn()
}));

jest.mock("../../utils/ApiError.js", () => {
  return jest.fn().mockImplementation((statusCode, message) => ({
    statusCode,
    message,
    success: false
  }));
});

jest.mock("../../utils/ApiResponse.js", () => {
  return jest.fn().mockImplementation((success, data, message) => ({
    success,
    data,
    message
  }));
});

// Now import after mocks
import crypto from "crypto";
import { OAuth2Client, __mockVerifyIdToken } from "google-auth-library";
import { User } from "../../models/User.models.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";

// Import the controller
const userController = require('../user.controller.js');
const { googleLogin } = userController;

describe("googleLogin() method", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    
    req = { 
      body: { 
        token: "mockGoogleToken" 
      } 
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
    };

    process.env.GOOGLE_CLIENT_ID = "mock-google-client-id";

    crypto.randomBytes.mockReturnValue({
      toString: jest.fn().mockReturnValue("mockRandomPasswordHex")
    });

    __mockVerifyIdToken.mockClear();
  });

  describe("Happy paths", () => {
    it("should successfully log in an existing user without profile picture", async () => {
      const mockPayload = { 
        email: "existing@example.com", 
        name: "Existing User"
      };
      
      const mockUser = {
        _id: "mockUserId",
        username: "Existing User",
        email: "existing@example.com",
        profilePicture: undefined,
        accesstoken: "",
        refreshtoken: "",
        generateAccessToken: jest.fn().mockReturnValue("mockAccessToken"),
        generateRefreshToken: jest.fn().mockReturnValue("mockRefreshToken"),
        save: jest.fn().mockResolvedValue(),
      };

      __mockVerifyIdToken.mockResolvedValue({ 
        getPayload: jest.fn().mockReturnValue(mockPayload) 
      });
      User.findOne.mockResolvedValue(mockUser);

      await googleLogin(req, res);

      expect(__mockVerifyIdToken).toHaveBeenCalledWith({
        idToken: "mockGoogleToken",
        audience: "mock-google-client-id",
      });

      expect(User.findOne).toHaveBeenCalledWith({ 
        email: "existing@example.com" 
      });

      expect(mockUser.generateAccessToken).toHaveBeenCalled();
      expect(mockUser.generateRefreshToken).toHaveBeenCalled();
      expect(mockUser.accesstoken).toBe("mockAccessToken");
      expect(mockUser.refreshtoken).toBe("mockRefreshToken");
      expect(mockUser.save).toHaveBeenCalled();

      expect(mockUser.profilePicture).toBeUndefined();

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.cookie).toHaveBeenCalledWith("accessToken", "mockAccessToken", expect.any(Object));
      expect(res.cookie).toHaveBeenCalledWith("refreshToken", "mockRefreshToken", expect.any(Object));
      
      expect(ApiResponse).toHaveBeenCalledWith(
        true, 
        { 
          user: { 
            _id: "mockUserId", 
            username: "Existing User", 
            email: "existing@example.com", 
            profilePicture: undefined,
            refreshToken: "mockRefreshToken", 
            accessToken: "mockAccessToken" 
          } 
        }, 
        'Google login successful'
      );
    });

    it("should successfully log in an existing user with profile picture from Google", async () => {
      const mockPayload = { 
        email: "existing@example.com", 
        name: "Existing User",
        picture: "https://google.com/profile-pic.jpg"
      };
      
      const mockUser = {
        _id: "mockUserId",
        username: "Existing User",
        email: "existing@example.com",
        profilePicture: "old-picture.jpg",
        accesstoken: "",
        refreshtoken: "",
        generateAccessToken: jest.fn().mockReturnValue("mockAccessToken"),
        generateRefreshToken: jest.fn().mockReturnValue("mockRefreshToken"),
        save: jest.fn().mockResolvedValue(),
      };

      __mockVerifyIdToken.mockResolvedValue({ 
        getPayload: jest.fn().mockReturnValue(mockPayload) 
      });
      User.findOne.mockResolvedValue(mockUser);

      await googleLogin(req, res);

      expect(__mockVerifyIdToken).toHaveBeenCalledWith({
        idToken: "mockGoogleToken",
        audience: "mock-google-client-id",
      });

      expect(mockUser.profilePicture).toBe("old-picture.jpg");

      expect(ApiResponse).toHaveBeenCalledWith(
        true, 
        { 
          user: expect.objectContaining({
            profilePicture: "old-picture.jpg"
          })
        }, 
        'Google login successful'
      );
    });

    it("should register and log in a new user without profile picture", async () => {
      const mockPayload = { 
        email: "newuser@example.com", 
        name: "New User"
      };
      
      const mockUser = {
        _id: "mockNewUserId",
        username: "New User",
        email: "newuser@example.com",
        profilePicture: undefined,
        accesstoken: "",
        refreshtoken: "",
        generateAccessToken: jest.fn().mockReturnValue("mockAccessToken"),
        generateRefreshToken: jest.fn().mockReturnValue("mockRefreshToken"),
        save: jest.fn().mockResolvedValue(),
      };

      __mockVerifyIdToken.mockResolvedValue({ 
        getPayload: jest.fn().mockReturnValue(mockPayload) 
      });
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(mockUser);

      await googleLogin(req, res);

      expect(User.create).toHaveBeenCalledWith({
        username: "New User",
        email: "newuser@example.com",
        password: "mockRandomPasswordHex",
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.cookie).toHaveBeenCalledWith("accessToken", "mockAccessToken", expect.any(Object));
      expect(res.cookie).toHaveBeenCalledWith("refreshToken", "mockRefreshToken", expect.any(Object));
    });

    it("should register and log in a new user with profile picture from Google", async () => {
      const mockPayload = { 
        email: "newuser@example.com", 
        name: "New User",
        picture: "https://google.com/new-profile-pic.jpg"
      };
      
      const mockUser = {
        _id: "mockNewUserId",
        username: "New User",
        email: "newuser@example.com",
        profilePicture: undefined,
        accesstoken: "",
        refreshtoken: "",
        generateAccessToken: jest.fn().mockReturnValue("mockAccessToken"),
        generateRefreshToken: jest.fn().mockReturnValue("mockRefreshToken"),
        save: jest.fn().mockResolvedValue(),
      };

      __mockVerifyIdToken.mockResolvedValue({ 
        getPayload: jest.fn().mockReturnValue(mockPayload) 
      });
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(mockUser);

      await googleLogin(req, res);

      expect(User.create).toHaveBeenCalledWith({
        username: "New User",
        email: "newuser@example.com",
        password: "mockRandomPasswordHex",
      });

      expect(mockUser.profilePicture).toBeUndefined();
    });

    // ----------------- Ensure User.create receives correct user object -----------------
    it("should call User.create with exact expected fields", async () => {
      const mockPayload = { 
        email: "brandnew@example.com", 
        name: "Brand New"
      };

      const mockUser = {
        _id: "newId1",
        username: "Brand New",
        email: "brandnew@example.com",
        generateAccessToken: jest.fn().mockReturnValue("AT"),
        generateRefreshToken: jest.fn().mockReturnValue("RT"),
        save: jest.fn().mockResolvedValue(),
      };

      __mockVerifyIdToken.mockResolvedValue({
        getPayload: jest.fn().mockReturnValue(mockPayload)
      });

      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(mockUser);

      await googleLogin(req, res);

      expect(User.create).toHaveBeenCalledWith({
        username: "Brand New",
        email: "brandnew@example.com",
        password: "mockRandomPasswordHex",
      });
    });

    // ----------------- Ensure verifyIdToken is called with correct arguments -----------------
    it("should call verifyIdToken with proper idToken and audience", async () => {
      const mockPayload = { email: "x@y.com", name: "X" };

      __mockVerifyIdToken.mockResolvedValue({
        getPayload: jest.fn().mockReturnValue(mockPayload),
      });

      User.findOne.mockResolvedValue({
        _id: "u9",
        username: "X",
        email: "x@y.com",
        generateAccessToken: jest.fn().mockReturnValue("aa"),
        generateRefreshToken: jest.fn().mockReturnValue("bb"),
        save: jest.fn().mockResolvedValue(),
      });

      await googleLogin(req, res);

      expect(__mockVerifyIdToken).toHaveBeenCalledWith({
        idToken: "mockGoogleToken",
        audience: "mock-google-client-id",
      });
    });

    // ----------------- Ensure all cookie options are correctly applied -----------------
    it("should apply full cookie options on login", async () => {
  const mockPayload = { 
    email: "abc@example.com", 
    name: "ABC" 
  };

  const mockUser = {
    _id: "u1",
    username: "ABC",
    email: "abc@example.com",
    generateAccessToken: jest.fn().mockReturnValue("A1"),
    generateRefreshToken: jest.fn().mockReturnValue("R1"),
    save: jest.fn().mockResolvedValue(),
  };

  __mockVerifyIdToken.mockResolvedValue({
    getPayload: jest.fn().mockReturnValue(mockPayload)
  });

  User.findOne.mockResolvedValue(mockUser);

  await googleLogin(req, res);

  const cookieOptions = expect.objectContaining({
    httpOnly: true,
    secure: true
  });

  expect(res.cookie).toHaveBeenCalledWith("accessToken", "A1", cookieOptions);
  expect(res.cookie).toHaveBeenCalledWith("refreshToken", "R1", cookieOptions);
});

  });

  describe("Error handling", () => {
    it("should handle invalid Google token", async () => {
      __mockVerifyIdToken.mockRejectedValue(new Error("Invalid token"));

      await googleLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(ApiError).toHaveBeenCalledWith(500, 'Google login failed');
    });

    it("should handle missing token in request body", async () => {
      req.body.token = undefined;

      await googleLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(ApiError).toHaveBeenCalledWith(500, 'Google login failed');
    });

    it("should handle database errors when finding user", async () => {
      const mockPayload = { 
        email: "test@example.com", 
        name: "Test User" 
      };
      
      __mockVerifyIdToken.mockResolvedValue({ 
        getPayload: jest.fn().mockReturnValue(mockPayload) 
      });
      User.findOne.mockRejectedValue(new Error("Database connection failed"));

      await googleLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(ApiError).toHaveBeenCalledWith(500, 'Google login failed');
    });

    it("should handle database errors when creating user", async () => {
      const mockPayload = { 
        email: "newuser@example.com", 
        name: "New User" 
      };
      
      __mockVerifyIdToken.mockResolvedValue({ 
        getPayload: jest.fn().mockReturnValue(mockPayload) 
      });
      User.findOne.mockResolvedValue(null);
      User.create.mockRejectedValue(new Error("User creation failed"));

      await googleLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(ApiError).toHaveBeenCalledWith(500, 'Google login failed');
    });

    it("should handle token generation errors", async () => {
      const mockPayload = { 
        email: "test@example.com", 
        name: "Test User" 
      };
      
      const mockUser = {
        _id: "mockUserId",
        username: "Test User",
        email: "test@example.com",
        generateAccessToken: jest.fn().mockImplementation(() => {
          throw new Error("Token generation failed");
        }),
        save: jest.fn().mockResolvedValue(),
      };

      __mockVerifyIdToken.mockResolvedValue({ 
        getPayload: jest.fn().mockReturnValue(mockPayload) 
      });
      User.findOne.mockResolvedValue(mockUser);

      await googleLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(ApiError).toHaveBeenCalledWith(500, 'Google login failed');
    });

    it("should handle user save errors after token generation", async () => {
      const mockPayload = { 
        email: "test@example.com", 
        name: "Test User" 
      };
      
      const mockUser = {
        _id: "mockUserId",
        username: "Test User",
        email: "test@example.com",
        generateAccessToken: jest.fn().mockReturnValue("mockAccessToken"),
        generateRefreshToken: jest.fn().mockReturnValue("mockRefreshToken"),
        save: jest.fn().mockRejectedValue(new Error("Save failed")),
      };

      __mockVerifyIdToken.mockResolvedValue({ 
        getPayload: jest.fn().mockReturnValue(mockPayload) 
      });
      User.findOne.mockResolvedValue(mockUser);

      await googleLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(ApiError).toHaveBeenCalledWith(500, 'Google login failed');
    });
  });

  describe("Edge cases", () => {
    it("should handle missing name in Google payload", async () => {
      const mockPayload = { 
        email: "noname@example.com"
      };
      
      const mockUser = {
        _id: "mockUserId",
        username: undefined,
        email: "noname@example.com",
        generateAccessToken: jest.fn().mockReturnValue("mockAccessToken"),
        generateRefreshToken: jest.fn().mockReturnValue("mockRefreshToken"),
        save: jest.fn().mockResolvedValue(),
      };

      __mockVerifyIdToken.mockResolvedValue({ 
        getPayload: jest.fn().mockReturnValue(mockPayload) 
      });
      User.findOne.mockResolvedValue(mockUser);

      await googleLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should handle cookie options correctly", async () => {
      const mockPayload = { 
        email: "test@example.com", 
        name: "Test User" 
      };
      
      const mockUser = {
        _id: "mockUserId",
        username: "Test User",
        email: "test@example.com",
        generateAccessToken: jest.fn().mockReturnValue("mockAccessToken"),
        generateRefreshToken: jest.fn().mockReturnValue("mockRefreshToken"),
        save: jest.fn().mockResolvedValue(),
      };

      __mockVerifyIdToken.mockResolvedValue({ 
        getPayload: jest.fn().mockReturnValue(mockPayload) 
      });
      User.findOne.mockResolvedValue(mockUser);

      await googleLogin(req, res);

      expect(res.cookie).toHaveBeenCalledWith(
        "accessToken", 
        "mockAccessToken", 
        expect.objectContaining({
          httpOnly: true,
          secure: true
        })
      );
      
      expect(res.cookie).toHaveBeenCalledWith(
        "refreshToken", 
        "mockRefreshToken", 
        expect.objectContaining({
          httpOnly: true,
          secure: true
        })
      );
    });

    it("should handle profilePicture field from Google payload correctly", async () => {
      const mockPayload = { 
        email: "test@example.com", 
        name: "Test User",
        profilePicture: "https://google.com/custom-profile-pic.jpg"
      };
      
      const mockUser = {
        _id: "mockUserId",
        username: "Test User",
        email: "test@example.com",
        profilePicture: "old-picture.jpg",
        accesstoken: "",
        refreshtoken: "",
        generateAccessToken: jest.fn().mockReturnValue("mockAccessToken"),
        generateRefreshToken: jest.fn().mockReturnValue("mockRefreshToken"),
        save: jest.fn().mockResolvedValue(),
      };

      __mockVerifyIdToken.mockResolvedValue({ 
        getPayload: jest.fn().mockReturnValue(mockPayload) 
      });
      User.findOne.mockResolvedValue(mockUser);

      await googleLogin(req, res);

      expect(mockUser.profilePicture).toBe("https://google.com/custom-profile-pic.jpg");
    });
  });
});
