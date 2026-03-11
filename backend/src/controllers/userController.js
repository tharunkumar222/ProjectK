import User from "../models/User.js";
import Complaint from "../models/Complaint.js";
import Payment from "../models/Payment.js";
import Announcement from "../models/Announcement.js";
import Room from "../models/Room.js";
import Laundry from "../models/Laundry.js";

const syncStudentRoom = async (studentId, nextRoomId) => {
  const rooms = await Room.find({ occupants: studentId });
  let nextRoom = null;

  if (nextRoomId) {
    nextRoom = await Room.findById(nextRoomId);

    if (!nextRoom) {
      const error = new Error("Assigned room not found");
      error.statusCode = 404;
      throw error;
    }

    const alreadyAssigned = nextRoom.occupants.some(
      (occupantId) => occupantId.toString() === studentId.toString()
    );

    if (!alreadyAssigned && nextRoom.occupants.length >= nextRoom.capacity) {
      const error = new Error("Assigned room is already at full capacity");
      error.statusCode = 400;
      throw error;
    }
  }

  await Promise.all(
    rooms.map(async (room) => {
      room.occupants = room.occupants.filter(
        (occupantId) => occupantId.toString() !== studentId.toString()
      );
      room.status =
        room.occupants.length >= room.capacity ? "occupied" : "available";
      await room.save();
    })
  );

  if (!nextRoom) {
    return null;
  }

  if (!nextRoom.occupants.some((occupantId) => occupantId.toString() === studentId.toString())) {
    nextRoom.occupants.push(studentId);
  }

  nextRoom.status =
    nextRoom.occupants.length >= nextRoom.capacity ? "occupied" : "available";
  await nextRoom.save();

  return nextRoom._id;
};

export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("room").select("-password");
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const allowedFields = ["fullName", "phone", "hostelName", "emergencyContact", "avatar"];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true
    })
      .populate("room")
      .select("-password");

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

export const getOwnerAnalytics = async (req, res, next) => {
  try {
    const [studentCount, complaintCount, pendingPayments, roomCount, latestAnnouncements, laundryCount] = await Promise.all([
      User.countDocuments({ role: "student" }),
      Complaint.countDocuments(),
      Payment.countDocuments({ status: { $in: ["pending", "under review"] } }),
      Room.countDocuments(),
      Announcement.find().sort({ createdAt: -1 }).limit(5),
      Laundry.countDocuments({ status: { $ne: "delivered" } })
    ]);

    res.json({
      success: true,
      analytics: {
        studentCount,
        complaintCount,
        pendingPayments,
        roomCount,
        activeLaundry: laundryCount,
        occupancyRate: roomCount ? Math.round((studentCount / (roomCount * 2)) * 100) : 0,
        latestAnnouncements
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getStudents = async (_req, res, next) => {
  try {
    const students = await User.find({ role: "student" }).populate("room").select("-password");
    res.json({ success: true, students });
  } catch (error) {
    next(error);
  }
};

export const updateStudentByOwner = async (req, res, next) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: "student" });

    if (!student) {
      const error = new Error("Student not found");
      error.statusCode = 404;
      throw error;
    }

    const allowedFields = ["fullName", "phone", "emergencyContact", "avatar"];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        student[field] = req.body[field];
      }
    });

    if (req.body.room !== undefined) {
      student.room = await syncStudentRoom(student._id, req.body.room || null);
    }

    await student.save();

    const updatedStudent = await User.findById(student._id).populate("room").select("-password");
    res.json({ success: true, student: updatedStudent });
  } catch (error) {
    next(error);
  }
};
