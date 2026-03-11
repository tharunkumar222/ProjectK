import express from "express";
import { createRoom, getRooms, updateRoom } from "../controllers/roomController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", protect, authorize("owner"), createRoom);
router.get("/get", protect, getRooms);
router.put("/update/:id", protect, authorize("owner"), updateRoom);

export default router;
