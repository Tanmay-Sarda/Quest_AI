import { getNotificationsForUser } from "../notification.controller.js";
import { Notification } from "../../models/Notification.models.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";

jest.mock("../../models/Notification.models.js");
jest.mock("../../utils/ApiError.js");
jest.mock("../../utils/ApiResponse.js");

const mockReq = (data) => data;
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};
const nextMock = jest.fn();

describe("getNotificationsForUser()", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should return 400 if userId missing", async () => {
    const req = mockReq({ user: {} });
    const res = mockRes();

    await getNotificationsForUser(req, res, nextMock);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(ApiError).toHaveBeenCalledWith(400, "User ID is required");
  });

  it("should fetch notifications successfully", async () => {
    const req = mockReq({ user: { id: "user123" } });
    const res = mockRes();

    Notification.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue([{ id: 1 }]),
      }),
    });

    ApiResponse.mockImplementation((code, data, msg) => ({
      code,
      data,
      msg,
    }));

    await getNotificationsForUser(req, res, nextMock);

    expect(Notification.find).toHaveBeenCalledWith({ toUser: "user123" });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should call next(error) on DB failure", async () => {
    const error = new Error("DB failed");

    Notification.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockRejectedValue(error),
      }),
    });

    const req = mockReq({ user: { id: "user123" } });
    const res = mockRes();

    await getNotificationsForUser(req, res, nextMock);

    expect(nextMock).toHaveBeenCalledWith(error);
  });
});
