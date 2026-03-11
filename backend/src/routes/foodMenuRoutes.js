import express from "express";
import {
  createFoodMenuItem,
  getFoodMenu,
  updateFoodMenuItem
} from "../controllers/foodMenuController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", protect, authorize("owner"), createFoodMenuItem);
router.get("/get", protect, getFoodMenu);
router.put("/update/:id", protect, authorize("owner"), updateFoodMenuItem);

export default router;
