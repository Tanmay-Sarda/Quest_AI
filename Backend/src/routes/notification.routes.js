import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { getNotificationsForUser, createNotification, deleteNotification } from "../controllers/notification.controller.js";

const router = Router();

router.use(verifyJWT);

router.get("/", getNotificationsForUser);
router.post("/create", createNotification);
router.delete("/delete/:notificationId", deleteNotification);


export default router;