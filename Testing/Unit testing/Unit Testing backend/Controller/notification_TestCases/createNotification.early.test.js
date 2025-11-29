import { createNotification } from "../notification.controller.js";
import { User } from "../../models/User.models.js";
import { Notification } from "../../models/Notification.models.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";

jest.mock("../../models/User.models.js");
jest.mock("../../models/Notification.models.js");

jest.mock("../../utils/ApiError.js", () => {
  return jest.fn().mockImplementation((code, msg) => ({ code, msg }));
});

jest.mock("../../utils/ApiResponse.js", () => {
  return jest.fn().mockImplementation((success, data, msg) => ({
    success,
    data,
    msg,
  }));
});

const mockReq = (body, user = {}) => ({ body, user });

const mockRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

const nextMock = jest.fn();

describe("createNotification() TESTS", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should return 404 if recipient user not found", async () => {
    User.findOne.mockResolvedValue(null);

    const req = mockReq(
      { email: "abc@gmail.com", story_id: "story1" },
      { id: "sender1" }
    );

    const res = mockRes();

    await createNotification(req, res, nextMock);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(ApiError).toHaveBeenCalledWith(404, "Recipient user not found");
  });

  it("should create notification successfully", async () => {
    User.findOne.mockResolvedValue({ _id: "user123" });
    Notification.create.mockResolvedValue({ _id: "noti1" });

    const req = mockReq(
      { email: "abc@gmail.com", story_id: "story1" },
      { id: "sender1" }
    );

    const res = mockRes();

    await createNotification(req, res, nextMock);

    expect(Notification.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(ApiResponse).toHaveBeenCalled();
  });

  it("should call next(error) when DB fails", async () => {
    const error = new Error("DB failed");   // FIXED - inside the test
    User.findOne.mockRejectedValue(error);

    const req = mockReq(
      { email: "abc@gmail.com", story_id: "story1" },
      { id: "sender1" }
    );

    const res = mockRes();

    await createNotification(req, res, nextMock);

    expect(nextMock).toHaveBeenCalledWith(error);
  });
});
