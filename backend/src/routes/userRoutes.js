import express from "express";
import {
  getOwnerAnalytics,
  getStudents,
  getUser,
  updateStudentByOwner,
  updateUser
} from "../controllers/userController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/getUser", protect, getUser);
router.put("/updateUser", protect, updateUser);
router.get("/students", protect, authorize("owner"), getStudents);
router.put("/students/:id", protect, authorize("owner"), updateStudentByOwner);
router.get("/analytics", protect, authorize("owner"), getOwnerAnalytics);

export default router;
