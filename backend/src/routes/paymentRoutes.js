import express from "express";
import { createPayment, getPayments, verifyPayment } from "../controllers/paymentController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/create", protect, upload.single("proof"), createPayment);
router.get("/get", protect, getPayments);
router.put("/verify/:id", protect, authorize("owner"), verifyPayment);

export default router;

