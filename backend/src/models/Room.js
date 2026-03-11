import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: true,
      unique: true
    },
    block: String,
    floor: String,
    capacity: {
      type: Number,
      default: 2
    },
    occupants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    rent: Number,
    amenities: [String],
    status: {
      type: String,
      enum: ["available", "occupied", "maintenance"],
      default: "available"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Room", roomSchema);

