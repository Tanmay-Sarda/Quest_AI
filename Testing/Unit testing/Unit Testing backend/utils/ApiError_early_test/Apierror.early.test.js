import ApiError from "../ApiError.js";

describe("ApiError Class", () => {
  
  test("should create ApiError with statusCode and message", () => {
    const err = new ApiError(400, "Bad Request");

    expect(err.statusCode).toBe(400);
    expect(err.message).toBe("Bad Request");
    expect(err.error).toEqual([]); // default
  });

  test("should store extra error details when provided", () => {
    const extra = ["Invalid email", "Password too short"];
    const err = new ApiError(422, "Validation Failed", extra);

    expect(err.statusCode).toBe(422);
    expect(err.message).toBe("Validation Failed");
    expect(err.error).toEqual(extra);
  });

  test("should handle empty message", () => {
    const err = new ApiError(500, "");

    expect(err.statusCode).toBe(500);
    expect(err.message).toBe("");
  });


});
