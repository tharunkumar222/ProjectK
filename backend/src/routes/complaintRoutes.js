import express from "express";
import {
  createComplaint,
  getComplaints,
  getStudentOverview,
  updateComplaintStatus
} from "../controllers/complaintController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", protect, authorize("student"), createComplaint);
router.get("/get", protect, getComplaints);
router.get("/overview", protect, authorize("student"), getStudentOverview);
router.put("/updateStatus/:id", protect, authorize("owner"), updateComplaintStatus);

export default router;

