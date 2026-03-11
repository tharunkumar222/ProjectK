import mongoose from "mongoose";

const foodMenuSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      required: true,
      trim: true
    },
    mealType: {
      type: String,
      enum: ["breakfast", "lunch", "snacks", "dinner"],
      required: true
    },
    items: {
      type: [String],
      default: []
    },
    notes: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("FoodMenu", foodMenuSchema);
