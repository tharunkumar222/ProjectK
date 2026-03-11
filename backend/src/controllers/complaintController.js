import Complaint from "../models/Complaint.js";
import User from "../models/User.js";

export const createComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.create({
      ...req.body,
      student: req.user._id,
      room: req.user.room || undefined
    });

    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate("student", "fullName email")
      .populate("room", "roomNumber block");

    res.status(201).json({ success: true, complaint: populatedComplaint });
  } catch (error) {
    next(error);
  }
};

export const getComplaints = async (req, res, next) => {
  try {
    const query = req.user.role === "owner" ? {} : { student: req.user._id };
    const complaints = await Complaint.find(query)
      .populate("student", "fullName email")
      .populate("room", "roomNumber block")
      .sort({ createdAt: -1 });

    res.json({ success: true, complaints });
  } catch (error) {
    next(error);
  }
};

export const updateComplaintStatus = async (req, res, next) => {
  try {
    const { status, resolutionNote } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      const error = new Error("Complaint not found");
      error.statusCode = 404;
      throw error;
    }

    complaint.status = status || complaint.status;
    complaint.resolutionNote = resolutionNote ?? complaint.resolutionNote;
    await complaint.save();

    const updatedComplaint = await Complaint.findById(req.params.id)
      .populate("student", "fullName email")
      .populate("room", "roomNumber block");

    res.json({ success: true, complaint: updatedComplaint });
  } catch (error) {
    next(error);
  }
};

export const getStudentOverview = async (req, res, next) => {
  try {
    const student = await User.findById(req.user._id).populate("room");
    const recentComplaints = await Complaint.find({ student: req.user._id }).sort({ createdAt: -1 }).limit(5);

    res.json({
      success: true,
      overview: {
        student,
        recentComplaints
      }
    });
  } catch (error) {
    next(error);
  }
};

