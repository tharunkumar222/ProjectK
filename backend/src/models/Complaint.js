import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ["electricity", "plumbing", "wifi", "food", "cleaning", "other"],
      default: "other"
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },
    status: {
      type: String,
      enum: ["pending", "in progress", "resolved"],
      default: "pending"
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room"
    },
    resolutionNote: String
  },
  { timestamps: true }
);

export default mongoose.model("Complaint", complaintSchema);

