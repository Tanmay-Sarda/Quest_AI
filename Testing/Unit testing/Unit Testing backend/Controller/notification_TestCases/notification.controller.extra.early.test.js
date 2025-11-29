import {
  getNotificationsForUser,
  createNotification,
  deleteNotification,
} from "../notification.controller.js";

// Mock models
jest.mock("../../models/User.models.js", () => ({
  User: { findOne: jest.fn() },
}));
jest.mock("../../models/Notification.models.js", () => ({
  Notification: { find: jest.fn(), create: jest.fn(), findOne: jest.fn() },
}));
jest.mock("../../models/Story.models.js", () => ({
  Story: { findById: jest.fn() },
}));

import { Notification } from "../../models/Notification.models.js";
import { User } from "../../models/User.models.js";
import { Story } from "../../models/Story.models.js";

const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

describe("Notification Controller – Mutation Optimized", () => {
  beforeEach(() => jest.clearAllMocks());

  /* -------------------------------------------------------------------
   * 1. getNotificationsForUser – Mutation Killers
   * ------------------------------------------------------------------*/

  test("400 when req.user missing", async () => {
    const req = { user: undefined };
    const res = makeRes();

    await getNotificationsForUser(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("uses correct populate arguments", async () => {
    const populateStory = jest.fn().mockResolvedValue([{ _id: "n1" }]);
    const populateFrom = jest.fn(() => ({ populate: populateStory }));

    Notification.find.mockReturnValue({ populate: populateFrom });

    const req = { user: { id: "u1" } };
    const res = makeRes();

    await getNotificationsForUser(req, res, jest.fn());

    expect(populateFrom).toHaveBeenCalledWith(
      "fromUser",
      "_id username email"
    );
    expect(populateStory).toHaveBeenCalledWith("story_id", "_id title");

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Notifications fetched successfully",
      })
    );
  });

  /* -------------------------------------------------------------------
   * 2. createNotification – Mutation Killers
   * ------------------------------------------------------------------*/

  test("missing req.user.id → returns 404", async () => {
    User.findOne.mockResolvedValue(null);

    const req = {
      user: {}, // missing id
      body: { email: "x@y.com", story_id: "s1" },
    };
    const res = makeRes();

    await createNotification(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("recipient not found → 404", async () => {
    User.findOne.mockResolvedValue(null);

    const req = {
      user: { id: "sender" },
      body: { email: "nobody@x.com", story_id: "s1" },
    };
    const res = makeRes();

    await createNotification(req, res, jest.fn());

    expect(User.findOne).toHaveBeenCalledWith({ email: "nobody@x.com" });
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("works when findOne() has no select() method", async () => {
    User.findOne.mockResolvedValue({ _id: "U1" });
    Notification.create.mockResolvedValue({ _id: "N1" });

    const req = {
      user: { id: "FROM" },
      body: { email: "a@b.com", story_id: "S1" },
    };
    const res = makeRes();

    await createNotification(req, res, jest.fn());

    expect(Notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        toUser: "U1",
        fromUser: "FROM",
        story_id: "S1",
        status: 0,
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test("select() chain works", async () => {
    User.findOne.mockImplementation(() => ({
      select: () => Promise.resolve({ _id: "SEL" }),
    }));
    Notification.create.mockResolvedValue({});

    const req = {
      user: { id: "FROM" },
      body: { email: "select@ex.com", story_id: "S1" },
    };
    const res = makeRes();

    await createNotification(req, res, jest.fn());

    expect(Notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        toUser: "SEL",
        fromUser: "FROM",
        story_id: "S1",
        status: 0,
      })
    );
  });

  test("correct success message", async () => {
    User.findOne.mockResolvedValue({ _id: "TO" });
    Notification.create.mockResolvedValue({});

    const req = {
      user: { id: "FROM" },
      body: { email: "a@b.com", story_id: "S1" },
    };
    const res = makeRes();

    await createNotification(req, res, jest.fn());

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Notification created successfully",
      })
    );
  });

  /* -------------------------------------------------------------------
   * 3. deleteNotification – Mutation Killers
   * ------------------------------------------------------------------*/

  test("400 when notificationId missing", async () => {
    const req = { params: {}, user: { id: "U" }, body: {} };
    const res = makeRes();

    await deleteNotification(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("400 when accept=true but character missing", async () => {
    const req = {
      params: { notificationId: "N1" },
      user: { id: "U" },
      body: { accept: true },
    };
    const res = makeRes();

    await deleteNotification(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("404 when notification not found", async () => {
    Notification.findOne.mockResolvedValue(null);

    const req = {
      params: { notificationId: "NF" },
      user: { id: "U" },
      body: {},
    };
    const res = makeRes();

    await deleteNotification(req, res, jest.fn());

    expect(Notification.findOne).toHaveBeenCalledWith({ _id: "NF" });
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("accept undefined → should NOT accept or decline", async () => {
    const notif = {
      _id: "nA",
      status: 0,
      story_id: "sA",
      toUser: "tA",
      fromUser: "fA",
      deleteOne: jest.fn(),
    };

    Notification.findOne.mockResolvedValue(notif);
    Notification.create.mockResolvedValue({});

    const req = {
      params: { notificationId: "nA" },
      user: { id: "tA" },
      body: {}, // accept undefined
    };
    const res = makeRes();

    await deleteNotification(req, res, jest.fn());

    // IMPORTANT: accept undefined DOES NOT decline in your controller
    expect(Notification.create).not.toHaveBeenCalled();

    expect(notif.deleteOne).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("404 when story missing on accept=true", async () => {
    const notif = {
      _id: "n1",
      status: 0,
      story_id: "s1",
      toUser: "u1",
      fromUser: "f1",
      deleteOne: jest.fn(),
    };

    Notification.findOne.mockResolvedValue(notif);
    Story.findById.mockResolvedValue(null);

    const req = {
      params: { notificationId: "n1" },
      user: { id: "u1" },
      body: { accept: true, character: "hero" },
    };
    const res = makeRes();

    await deleteNotification(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("accept=true success", async () => {
    const notif = {
      _id: "n2",
      status: 0,
      story_id: "s2",
      toUser: "t2",
      fromUser: "f2",
      deleteOne: jest.fn(),
    };

    const story = {
      _id: "s2",
      ownerid: [],
      save: jest.fn(),
    };

    Notification.findOne.mockResolvedValue(notif);
    Story.findById.mockResolvedValue(story);
    Notification.create.mockResolvedValue({});

    const req = {
      params: { notificationId: "n2" },
      user: { id: "t2" },
      body: { accept: true, character: "mage" },
    };
    const res = makeRes();

    await deleteNotification(req, res, jest.fn());

    expect(story.ownerid[0]).toEqual({
      owner: "t2",
      character: "mage",
    });

    expect(story.save).toHaveBeenCalled();
    expect(Notification.create).toHaveBeenCalled();
    expect(notif.deleteOne).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("decline path accept=false", async () => {
    const notif = {
      _id: "n3",
      status: 0,
      story_id: "s3",
      toUser: "t3",
      fromUser: "f3",
      deleteOne: jest.fn(),
    };

    Notification.findOne.mockResolvedValue(notif);
    Notification.create.mockResolvedValue({});

    const req = {
      params: { notificationId: "n3" },
      user: { id: "t3" },
      body: { accept: false },
    };
    const res = makeRes();

    await deleteNotification(req, res, jest.fn());

    expect(Notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        toUser: "f3",
        fromUser: "t3",
        story_id: "s3",
        status: 2,
      })
    );

    expect(notif.deleteOne).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
