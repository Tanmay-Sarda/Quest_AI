import axios from "axios";
import { createStory } from "../story.controller.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import mongoose from "mongoose";

// -------------------- FIXED Story Mock --------------------
jest.mock("../../models/Story.models.js", () => ({
  Story: {
    create: jest.fn(),
  },
}));

// -------------------- FIXED Mongoose Mock --------------------
jest.mock("mongoose", () => {
  function MockSchema() {}
  MockSchema.prototype.pre = jest.fn();
  MockSchema.prototype.methods = {};
  MockSchema.prototype.statics = {};
  MockSchema.prototype.index = jest.fn();

  const FakeModel = {
    findById: jest.fn(),
  };

  return {
    Schema: MockSchema,
    model: jest.fn(() => FakeModel),
  };
});

// -------------------- Utilities --------------------
jest.mock("axios");

jest.mock("../../utils/ApiError.js", () =>
  jest.fn().mockImplementation((status, message) => ({
    status,
    message,
  }))
);

jest.mock("../../utils/ApiResponse.js", () =>
  jest.fn().mockImplementation((status, data, message) => ({
    status,
    data,
    message,
  }))
);

describe("createStory() - FULL FIXED COVERAGE", () => {
  let req, res, UserModel;
  const { Story } = require("../../models/Story.models.js");

  beforeEach(() => {
    req = {
      body: {
        title: "My Story",
        description: "Desc",
        character: "Hero",
        genre: "Fantasy",
      },
      user: { _id: "user123" },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    process.env.FASTAPI_URL = "http://localhost:8000";

    UserModel = mongoose.model();
    jest.clearAllMocks();
  });

  // -----------------------------------------------------
  // 1. Authentication Failure
  // -----------------------------------------------------
  it("should return 401 if req.user is missing", async () => {
    req.user = null;

    await createStory(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(ApiError).toHaveBeenCalledWith(401, "You must login first");
  });

  // -----------------------------------------------------
  // 2. Missing API Key
  // -----------------------------------------------------
  it("should return 403 if user does not exist", async () => {
    UserModel.findById.mockResolvedValue(null);

    await createStory(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(ApiError).toHaveBeenCalledWith(
      403,
      "API key is required to create a story."
    );
  });

  it("should return 403 if user has no apiKey", async () => {
    UserModel.findById.mockResolvedValue({ apiKey: null });

    await createStory(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(ApiError).toHaveBeenCalledWith(
      403,
      "API key is required to create a story."
    );
  });

  // -----------------------------------------------------
  // 3. Validation Cases
  //   FIX: mock user with valid apiKey first
  // -----------------------------------------------------
  it("should return 400 if title missing", async () => {
    UserModel.findById.mockResolvedValue({ apiKey: "abc" });
    req.body.title = "";

    await createStory(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(ApiError).toHaveBeenCalledWith(
      400,
      "Title, description, and character name are required"
    );
  });

  it("should return 400 if description missing", async () => {
    UserModel.findById.mockResolvedValue({ apiKey: "abc" });
    req.body.description = "";

    await createStory(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(ApiError).toHaveBeenCalledWith(
      400,
      "Title, description, and character name are required"
    );
  });

  it("should return 400 if character missing", async () => {
    UserModel.findById.mockResolvedValue({ apiKey: "abc" });
    req.body.character = "";

    await createStory(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(ApiError).toHaveBeenCalledWith(
      400,
      "Title, description, and character name are required"
    );
  });

  // -----------------------------------------------------
  // 4. AI Service Cases
  // -----------------------------------------------------
  it("should return 500 if AI returns no content", async () => {
    UserModel.findById.mockResolvedValue({ apiKey: "abc" });

    axios.post.mockResolvedValue({
      data: { content: null, dialect: "en" },
    });

    await createStory(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(ApiError).toHaveBeenCalledWith(
      500,
      "AI service did not return story content."
    );
  });


  it("should handle AI failure with missing detail", async () => {
    UserModel.findById.mockResolvedValue({ apiKey: "abc" });

    axios.post.mockRejectedValue({
      response: { status: 500 },
    });

    await createStory(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(ApiError).toHaveBeenCalledWith(
      500,
      "Failed to create story via AI service."
    );
  });

  it("should handle AI network error", async () => {
    UserModel.findById.mockResolvedValue({ apiKey: "abc" });

    axios.post.mockRejectedValue(new Error("Network error"));

    await createStory(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(ApiError).toHaveBeenCalledWith(
      500,
      "Failed to create story via AI service."
    );
  });

  // -----------------------------------------------------
  // 4.5 Validate FastAPI request payload 
  // -----------------------------------------------------
  it("should call FastAPI with correct request payload", async () => {
    UserModel.findById.mockResolvedValue({ apiKey: "abc" });

    axios.post.mockResolvedValue({
      data: { content: "Hello", dialect: "en" },
    });

    await createStory(req, res);

    const expectedPayload = {
      name: "My Story",
      description: "Desc",
      owner: {
        owner: "user123",
        character: "Hero",
      },
      genre: "Fantasy",
      api_key: "abc",
    };

    expect(axios.post).toHaveBeenCalledWith(
      "http://localhost:8000/story/new",
      expectedPayload
    );
  });

  // -----------------------------------------------------
  // 5. Success Case
  // -----------------------------------------------------
 it("should create story successfully", async () => {
  UserModel.findById.mockResolvedValue({ apiKey: "abc" });

  axios.post.mockResolvedValue({
    data: { content: "Hello", dialect: "en" },
  });

  const mockStory = {
    _id: "story123",
    title: "My Story",
    description: "Desc",
    genre: "Fantasy",
    content: [{ response: "Hello" }],
    complete: false,
    createdAt: new Date("2025-01-01"),
  };

  Story.create.mockResolvedValue(mockStory);

  await createStory(req, res);

  // Check Story.create parameters
  expect(Story.create).toHaveBeenCalledWith({
    title: "My Story",
    description: "Desc",
    genre: "Fantasy",
    dialect: "en",
    ownerid: [{ owner: "user123", character: "Hero" }],
    content: [
      {
        prompt: "Starting scene for My Story",
        user: "user123",
        response: "Hello",
      },
    ],
    complete: false,
    public: false,
  });

  // Expected response body
  const expectedResponse = {
    status: 201,
    data: {
      _id: "story123",
      title: "My Story",
      description: "Desc",
      genre: "Fantasy",
      character: "Hero",
      content: [{ response: "Hello" }],
      complete: false,
      createdAt: new Date("2025-01-01"),
    },
    message: "Story created and saved successfully",
  };

  expect(res.status).toHaveBeenCalledWith(201);
  expect(res.json).toHaveBeenCalledWith(expectedResponse);
});

});
