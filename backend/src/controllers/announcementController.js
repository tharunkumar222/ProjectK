import Announcement from "../models/Announcement.js";

export const createAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.create({
      ...req.body,
      createdBy: req.user._id
    });

    const populatedAnnouncement = await Announcement.findById(announcement._id).populate(
      "createdBy",
      "fullName role"
    );

    res.status(201).json({ success: true, announcement: populatedAnnouncement });
  } catch (error) {
    next(error);
  }
};

export const getAnnouncements = async (req, res, next) => {
  try {
    const audienceFilter =
      req.user.role === "student" ? { audience: { $in: ["all", "students"] } } : {};

    const announcements = await Announcement.find(audienceFilter)
      .populate("createdBy", "fullName role")
      .sort({ createdAt: -1 });

    res.json({ success: true, announcements });
  } catch (error) {
    next(error);
  }
};

