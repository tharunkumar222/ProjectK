import mongoose from "mongoose";

const laundrySchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    itemCount: {
      type: Number,
      required: true,
      min: 1
    },
    serviceType: {
      type: String,
      enum: ["wash", "wash & iron", "dry clean"],
      default: "wash"
    },
    status: {
      type: String,
      enum: ["requested", "picked up", "washing", "ready", "delivered"],
      default: "requested"
    },
    pickupDate: Date,
    deliveryDate: Date,
    amount: {
      type: Number,
      default: 0
    },
    notes: String
  },
  { timestamps: true }
);

export default mongoose.model("Laundry", laundrySchema);
