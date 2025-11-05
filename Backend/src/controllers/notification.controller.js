import { User } from "../models/User.models.js";
import { Notification } from "../models/Notification.models.js";
import { Story } from "../models/Story.models.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

const getNotificationsForUser = async (req, res) => {

    const userId = req.user.id;

    if (!userId) {
        return res.status(400).json(new ApiError(400, "User ID is required"));
    }

    //Notification has three different section of data: toUser, fromUser, story_id
    const notifications = await Notification.find({ toUser: userId })
        .populate('fromUser', '_id username email') // Populate fromUser with username and email
        .populate('story_id', '_id title'); // Populate story_id with title and summary

    return res.status(200).json(new ApiResponse(200, notifications, "Notifications fetched successfully"));
}

const createNotification = async (req, res) => {

    const { email, story_id } = req.body;

    const fromUserId = req.user.id;

    const toUser = await User.findOne({ email: email }).select("_id");
    if (!toUser) {
        return res.status(404).json(new ApiError(404, "Recipient user not found"));
    }

    const noti = await Notification.create({
        toUser: toUser._id,
        fromUser: fromUserId,
        story_id: story_id,
        status: 0,
    });

    return res.status(201).json(new ApiResponse(201, noti, "Notification created successfully"));
}

const deleteNotification = async (req, res) => {
   
    const { notificationId } = req.params;
    const { accept, character } = req.body;

    if (!notificationId) {
        return res.status(400).json(new ApiError(400, "Notification ID is required"));
    }
      console.log("Delete notification called");
    if (accept && !character) {
        return res.status(400).json(new ApiError(400, "Character is required when accepting a notification"));
    }


    const notification = await Notification.findOne({ _id: notificationId });
    if (!notification) {
        return res.status(404).json(new ApiError(404, "Notification not found or you are not authorized to delete it"));
    }

    if (accept !== undefined && notification.status === 0) {

        if (accept) {
            console.log("Adding user to story as per notification acceptance");
            //add owner to story
            const story = await Story.findById(notification.story_id);
            if (!story) {
                return res.status(404).json(new ApiError(404, "Story not found"));
            }

            story.ownerid.push({ owner: notification.toUser, character: character });
            await story.save();
        }
        //Create notification for the fromUser about rejection or acceptance
        console.log("Creating new notification for the sender about the decision");
        const newNotification = await Notification.create({
            toUser: notification.fromUser,
            fromUser: notification.toUser,
            story_id: notification.story_id,
            status: accept ? 1 : 2,
        });
    }
    await notification.deleteOne();
      console.log("Delete notification called");
    return res.status(200).json(new ApiResponse(200, null, "Notification deleted successfully"));
}

export { getNotificationsForUser, createNotification, deleteNotification };
