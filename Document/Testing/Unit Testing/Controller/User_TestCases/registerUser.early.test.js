import { registerUser } from "../user.controller.js";
import { User } from "../../models/User.models.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";

jest.mock("../../models/User.models.js", () => ({
  User: jest.fn()
}));

// static methods
User.findOne = jest.fn();

describe("registerUser()", () => {
  let res;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.clearAllMocks();
  });

  // ----------------- Missing Username -----------------
  it("should return 408 if username is empty", async () => {
    const req = {
      body: {
        username: "",
        email: "user1@example.com",
        password: "pass123"
      }
    };

    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(408);
    expect(res.json).toHaveBeenCalledWith(
      new ApiError(408, "Required username,password and email")
    );
  });

  // ----------------- Missing Email -----------------
  it("should return 408 if email is empty", async () => {
    const req = {
      body: {
        username: "testuser2",
        email: "",
        password: "pass123"
      }
    };

    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(408);
    expect(res.json).toHaveBeenCalledWith(
      new ApiError(408, "Required username,password and email")
    );
  });

  // ----------------- Missing Password -----------------
  it("should return 408 if password is empty", async () => {
    const req = {
      body: {
        username: "testuser3",
        email: "user3@example.com",
        password: ""
      }
    };

    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(408);
    expect(res.json).toHaveBeenCalledWith(
      new ApiError(408, "Required username,password and email")
    );
  });

  // ----------------- User Already Exists -----------------
  it("should return 409 if user already exists", async () => {
    const req = {
      body: {
        username: "testuser4",
        email: "exists@example.com",
        password: "pass123"
      }
    };

    User.findOne.mockResolvedValue({ email: "exists@example.com" });

    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      new ApiError(409, "User already exists with this email")
    );
  });

  // ----------------- Successful Registration -----------------
  it("should register a new user successfully", async () => {
    const req = {
      body: {
        username: "newuser",
        email: "newuser@example.com",
        password: "pass123"
      }
    };

    User.findOne.mockResolvedValue(null);

    const mockUser = {
      save: jest.fn().mockResolvedValue(),
      _id: "abc123",
      username: "newuser",
      email: "newuser@example.com"
    };

    User.mockImplementation(() => mockUser);

    await registerUser(req, res);

    //  NEW ASSERTION (kills ObjectLiteral mutant)
    expect(User).toHaveBeenCalledWith({
      username: "newuser",
      email: "newuser@example.com",
      password: "pass123"
    });

    expect(User.findOne).toHaveBeenCalledWith({ email: "newuser@example.com" });
    expect(mockUser.save).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      new ApiResponse(
        201,
        { _id: "abc123", username: "newuser", email: "newuser@example.com" },
        "User registered successfully"
      )
    );
  });

  // ----------------- Save Error -----------------
  it("should return 500 if save() throws an error", async () => {
    const req = {
      body: {
        username: "erroruser",
        email: "error@example.com",
        password: "pass123"
      }
    };

    User.findOne.mockResolvedValue(null);

    const mockUser = {
      save: jest.fn().mockRejectedValue(new Error("DB error"))
    };

    User.mockImplementation(() => mockUser);

    await registerUser(req, res);

    //  NEW ASSERTION (kills ObjectLiteral mutant on error path)
    expect(User).toHaveBeenCalledWith({
      username: "erroruser",
      email: "error@example.com",
      password: "pass123"
    });

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      new ApiError(500, "Could not register user")
    );
  });
});
