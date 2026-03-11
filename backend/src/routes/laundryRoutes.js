import express from "express";
import {
  createLaundryRequest,
  getLaundryRequests,
  updateLaundryStatus
} from "../controllers/laundryController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", protect, createLaundryRequest);
router.get("/get", protect, getLaundryRequests);
router.put("/update/:id", protect, authorize("owner"), updateLaundryStatus);

export default router;
