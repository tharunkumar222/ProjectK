import Laundry from "../models/Laundry.js";

export const createLaundryRequest = async (req, res, next) => {
  try {
    const laundry = await Laundry.create({
      ...req.body,
      student: req.user.role === "student" ? req.user._id : req.body.student
    });

    const populatedLaundry = await Laundry.findById(laundry._id).populate(
      "student",
      "fullName email room"
    );

    res.status(201).json({ success: true, laundry: populatedLaundry });
  } catch (error) {
    next(error);
  }
};

export const getLaundryRequests = async (req, res, next) => {
  try {
    const query = req.user.role === "owner" ? {} : { student: req.user._id };
    const laundryRequests = await Laundry.find(query)
      .populate("student", "fullName email")
      .sort({ createdAt: -1 });

    res.json({ success: true, laundryRequests });
  } catch (error) {
    next(error);
  }
};

export const updateLaundryStatus = async (req, res, next) => {
  try {
    const laundry = await Laundry.findById(req.params.id);

    if (!laundry) {
      const error = new Error("Laundry request not found");
      error.statusCode = 404;
      throw error;
    }

    const allowedFields = ["status", "pickupDate", "deliveryDate", "amount", "notes", "itemCount", "serviceType"];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        laundry[field] = req.body[field];
      }
    });

    await laundry.save();

    const updatedLaundry = await Laundry.findById(laundry._id).populate(
      "student",
      "fullName email"
    );

    res.json({ success: true, laundry: updatedLaundry });
  } catch (error) {
    next(error);
  }
};
