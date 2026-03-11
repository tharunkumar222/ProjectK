import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    dueDate: Date,
    paidAt: Date,
    monthLabel: String,
    method: {
      type: String,
      enum: ["upi", "bank transfer", "cash", "card"],
      default: "upi"
    },
    status: {
      type: String,
      enum: ["pending", "under review", "verified", "rejected"],
      default: "pending"
    },
    proofUrl: String,
    notes: String,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);

