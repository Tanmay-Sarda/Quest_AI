import "../User_early_test/setupTestDB.js";
import { User } from "../User.models.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

jest.mock("bcrypt");

beforeEach(async () => {
  jest.clearAllMocks();
  await User.deleteMany({});
});

describe("User Model Methods & Hooks - Full Coverage", () => {

  test("should hash password and apiKey before saving", async () => {
    bcrypt.hash.mockImplementation((val) => `hashed_${val}`);
    
    const user = new User({
      username: "duck",
      email: "duck@gmail.com",
      password: "123456",
      apiKey: "originalApiKey"
    });

    await user.save();

    expect(user.password).toBe("hashed_123456");
    expect(user.apiKey).toBe("hashed_originalApiKey");
  });

 test("should not hash if password or apiKey not modified", async () => {
  bcrypt.hash.mockImplementation((val) => `hashed_${val}`);

  const user = new User({
    username: "duck",
    email: "duck@gmail.com",
    password: "123456",
    apiKey: "originalApiKey"
  });

  await user.save();

  // Spy on isModified and return false
  const spy = jest.spyOn(user, "isModified").mockReturnValue(false);

  await user.save();

  expect(bcrypt.hash).toHaveBeenCalledTimes(2); // Only the first save actually hashes
  spy.mockRestore();
});


  test("isPasswordCorrect returns true/false properly", async () => {
    bcrypt.compare.mockImplementation((input, hashed) => input === "correct");
    
    const user = new User({ username: "duck", email: "a@b.com", password: "correct" });
    await user.save();

    expect(await user.isPasswordCorrect("correct")).toBe(true);
    expect(await user.isPasswordCorrect("wrong")).toBe(false);
    expect(await user.isPasswordCorrect(null)).toBe(false);
  });

  test("isApiKeyCorrect returns true/false properly", async () => {
    bcrypt.compare.mockImplementation((input, hashed) => input === "api123");
    
    const user = new User({ username: "duck", email: "a@b.com", password: "pwd", apiKey: "api123" });
    await user.save();

    expect(await user.isApiKeyCorrect("api123")).toBe(true);
    expect(await user.isApiKeyCorrect("wrong")).toBe(false);
  });

  test("generateAccessToken returns valid JWT", () => {
    process.env.ACCESS_TOKEN_SECRET = "secret";
    process.env.ACCESS_TOKEN_EXPIRY = "1h";

    const user = new User({ _id: "123", email: "a@b.com", username: "duck" });

    const token = user.generateAccessToken();
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    expect(decoded.email).toBe("a@b.com");
    expect(decoded.username).toBe("duck");
  });

  test("generateAccessToken throws if secret missing", () => {
    delete process.env.ACCESS_TOKEN_SECRET;

    const user = new User({ _id: "123", email: "a@b.com", username: "duck" });
    expect(() => user.generateAccessToken()).toThrow();
  });

  test("generateRefreshToken returns valid JWT", () => {
    process.env.REFRESH_TOKEN_SECRET = "rSecret";
    process.env.REFRESH_TOKEN_EXPIRY = "2d";

    const user = new User({ _id: new mongoose.Types.ObjectId(), email: "a@b.com" });

    const token = user.generateRefreshToken();
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

    expect(decoded._id.toString()).toBe(user._id.toString());
  });

  test("generateRefreshToken throws if secret missing", () => {
    delete process.env.REFRESH_TOKEN_SECRET;

    const user = new User({ _id: new mongoose.Types.ObjectId(), email: "a@b.com" });
    expect(() => user.generateRefreshToken()).toThrow();
  });

});
