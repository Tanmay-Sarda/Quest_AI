import { deleteNotification } from "../notification.controller.js";
import { Notification } from "../../models/Notification.models.js";
import { Story } from "../../models/Story.models.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";

// mocks
jest.mock("../../models/Notification.models.js");
jest.mock("../../models/Story.models.js");
jest.mock("../../utils/ApiError.js");
jest.mock("../../utils/ApiResponse.js");

// request/response mocks
const mockReq = (params = {}, body = {}) => ({ params, body });
const mockRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

// test suite
describe("deleteNotification() TESTS", () => {
  beforeEach(() => jest.clearAllMocks());

  // 1) No notificationId
  it("should return 400 if notificationId missing", async () => {
    const req = mockReq({}, {});
    const res = mockRes();

    await deleteNotification(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(ApiError).toHaveBeenCalledWith(400, "Notification ID is required");
  });

  // 2) Accept = true but character missing
  it("should return 400 when accept=true and no character", async () => {
    const req = mockReq({ notificationId: "123" }, { accept: true });
    const res = mockRes();

    await deleteNotification(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(ApiError).toHaveBeenCalledWith(
      400,
      "Character is required when accepting a notification"
    );
  });

  // 3) Notification not found
  it("should return 404 if notification not found", async () => {
    Notification.findOne.mockResolvedValue(null);

    const req = mockReq({ notificationId: "123" }, {});
    const res = mockRes();

    await deleteNotification(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(ApiError).toHaveBeenCalledWith(
      404,
      "Notification not found or you are not authorized to delete it"
    );
  });

  // 4) Accept true → story not found
  it("should return 404 if story not found on accept", async () => {
    Notification.findOne.mockResolvedValue({
      status: 0,
      story_id: "story1",
      toUser: "userA",
      fromUser: "userB",
    });

    Story.findById.mockResolvedValue(null);

    const req = mockReq({ notificationId: "123" }, { accept: true, character: "Wizard" });
    const res = mockRes();

    await deleteNotification(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(ApiError).toHaveBeenCalledWith(404, "Story not found");
  });

  // 5) Successfully accept & delete
  it("should accept notification and delete it", async () => {
    const saveMock = jest.fn();

    Notification.findOne.mockResolvedValue({
      status: 0,
      story_id: "story1",
      toUser: "userA",
      fromUser: "userB",
      deleteOne: jest.fn(),
    });

    Story.findById.mockResolvedValue({
      ownerid: [],
      save: saveMock,
    });

    Notification.create.mockResolvedValue({});

    const req = mockReq(
      { notificationId: "123" },
      { accept: true, character: "Knight" }
    );
    const res = mockRes();

    await deleteNotification(req, res);

    expect(saveMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(ApiResponse).toHaveBeenCalledWith(
      200,
      null,
      "Notification deleted successfully"
    );
  });

  // 6) Decline notification
  it("should decline notification and delete it", async () => {
    Notification.findOne.mockResolvedValue({
      status: 0,
      story_id: "story1",
      toUser: "userA",
      fromUser: "userB",
      deleteOne: jest.fn(),
    });

    Story.findById.mockResolvedValue({}); // not used for decline
    Notification.create.mockResolvedValue({});

    const req = mockReq(
      { notificationId: "123" },
      { accept: false }
    );
    const res = mockRes();

    await deleteNotification(req, res);

    expect(Notification.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  // 7) No accept provided and status !== 0 — should simply delete and return 200
  it("should delete notification when accept is undefined and status is not 0", async () => {
    const deleteMock = jest.fn();

    Notification.findOne.mockResolvedValue({
      status: 1,
      story_id: "story1",
      toUser: "userA",
      fromUser: "userB",
      deleteOne: deleteMock,
    });

    // Notification.create should NOT be called in this path
    Notification.create.mockResolvedValue({});

    const req = mockReq({ notificationId: "456" }, {});
    const res = mockRes();

    await deleteNotification(req, res);

    expect(deleteMock).toHaveBeenCalled();
    expect(Notification.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("deleteNotification returns ApiResponse payload on delete", async () => {
    const deleteMock = jest.fn();

    Notification.findOne.mockResolvedValue({
      status: 1,
      story_id: "story1",
      toUser: "userA",
      fromUser: "userB",
      deleteOne: deleteMock,
    });

    Notification.create.mockResolvedValue({});

    const req = mockReq({ notificationId: "789" }, {});
    const res = mockRes();

    await deleteNotification(req, res);

    expect(deleteMock).toHaveBeenCalled();
    // ApiResponse is mocked in this test file — assert it was constructed correctly
    expect(ApiResponse).toHaveBeenCalledWith(
      200,
      null,
      "Notification deleted successfully"
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('deleteNotification calls next when DB throws', async () => {
    Notification.findOne.mockRejectedValue(new Error('dbfail'));

    const req = mockReq({ notificationId: '999' }, {});
    const res = mockRes();
    const next = jest.fn();

    await deleteNotification(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
