import FoodMenu from "../models/FoodMenu.js";

export const createFoodMenuItem = async (req, res, next) => {
  try {
    const items =
      Array.isArray(req.body.items) ? req.body.items : String(req.body.items || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

    const foodMenuItem = await FoodMenu.create({
      ...req.body,
      items,
      createdBy: req.user._id
    });

    const populatedItem = await FoodMenu.findById(foodMenuItem._id).populate(
      "createdBy",
      "fullName role"
    );

    res.status(201).json({ success: true, foodMenuItem: populatedItem });
  } catch (error) {
    next(error);
  }
};

export const getFoodMenu = async (_req, res, next) => {
  try {
    const menu = await FoodMenu.find()
      .populate("createdBy", "fullName role")
      .sort({ createdAt: -1 });

    res.json({ success: true, menu });
  } catch (error) {
    next(error);
  }
};

export const updateFoodMenuItem = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    if (req.body.items !== undefined) {
      updates.items = Array.isArray(req.body.items)
        ? req.body.items
        : String(req.body.items || "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
    }

    const foodMenuItem = await FoodMenu.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    }).populate("createdBy", "fullName role");

    if (!foodMenuItem) {
      const error = new Error("Food menu item not found");
      error.statusCode = 404;
      throw error;
    }

    res.json({ success: true, foodMenuItem });
  } catch (error) {
    next(error);
  }
};
