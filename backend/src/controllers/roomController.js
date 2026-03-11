import Room from "../models/Room.js";

export const createRoom = async (req, res, next) => {
  try {
    const room = await Room.create(req.body);
    res.status(201).json({ success: true, room });
  } catch (error) {
    next(error);
  }
};

export const getRooms = async (_req, res, next) => {
  try {
    const rooms = await Room.find().populate("occupants", "fullName email role");
    res.json({ success: true, rooms });
  } catch (error) {
    next(error);
  }
};

export const updateRoom = async (req, res, next) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate("occupants", "fullName email role");

    if (!room) {
      const error = new Error("Room not found");
      error.statusCode = 404;
      throw error;
    }

    res.json({ success: true, room });
  } catch (error) {
    next(error);
  }
};
