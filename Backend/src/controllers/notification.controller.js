import { User } from "../models/User.models.js";
import { Notification } from "../models/Notification.models.js";
import { Story } from "../models/Story.models.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

/****************************************
 * GET NOTIFICATIONS FOR USER
 ****************************************/
const getNotificationsForUser = async (req, res, next) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(400).json(new ApiError(400, "User ID is required"));
  }

  try {
    const notifications = await Notification.find({ toUser: userId })
      .populate("fromUser", "_id username email")
      .populate("story_id", "_id title");

    return res
      .status(200)
      .json(
        new ApiResponse(200, notifications, "Notifications fetched successfully")
      );
  } catch (error) {
    next(error); 
  }
};

/****************************************
 * CREATE NOTIFICATION
 ****************************************/
const createNotification = async (req, res, next) => {
  try {
    const { email, story_id } = req.body;

    const fromUserId = req.user?.id; // ⭐ CHANGE: safe access

    // Support both Mongoose Query (with chainable .select) and mocked returns
    let findOneResult = User.findOne({ email: email });
    if (findOneResult && typeof findOneResult.select === "function") {
      findOneResult = findOneResult.select("_id");
    }
    const toUser = await findOneResult;
    if (!toUser) {
      return res
        .status(404)
        .json(new ApiError(404, "Recipient user not found"));
    }

    const noti = await Notification.create({
      toUser: toUser._id,
      fromUser: fromUserId,
      story_id: story_id,
      status: 0,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, noti, "Notification created successfully"));
  } catch (error) {
    next(error); 
  }
};

/****************************************
 * DELETE NOTIFICATION
 ****************************************/
const deleteNotification = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    const { accept, character } = req.body;

    if (!notificationId) {
      return res
        .status(400)
        .json(new ApiError(400, "Notification ID is required"));
    }

    if (accept && !character) {
      return res
        .status(400)
        .json(
          new ApiError(
            400,
            "Character is required when accepting a notification"
          )
        );
    }

    const notification = await Notification.findOne({ _id: notificationId });
    if (!notification) {
      return res.status(404).json(
        new ApiError(
          404,
          "Notification not found or you are not authorized to delete it"
        )
      );
    }

    if (accept !== undefined && notification.status === 0) {
      if (accept) {
        const story = await Story.findById(notification.story_id);

        if (!story) {
          return res.status(404).json(new ApiError(404, "Story not found"));
        }

        story.ownerid.push({
          owner: notification.toUser,
          character: character,
        });

        await story.save();
      }

      // Create notification for sender
      await Notification.create({
        toUser: notification.fromUser,
        fromUser: notification.toUser,
        story_id: notification.story_id,
        status: accept ? 1 : 2,
      });
    }

    await notification.deleteOne();

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Notification deleted successfully"));
  } catch (error) {
    next(error); 
  }
};

export { getNotificationsForUser, createNotification, deleteNotification };