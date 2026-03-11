import express from "express";
import { createAnnouncement, getAnnouncements } from "../controllers/announcementController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", protect, authorize("owner"), createAnnouncement);
router.get("/get", protect, getAnnouncements);

export default router;

