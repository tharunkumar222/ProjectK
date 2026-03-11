import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

export const signup = async (req, res, next) => {
  try {
    const { fullName, email, password, role, phone, hostelName } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const error = new Error("User already exists with this email");
      error.statusCode = 409;
      throw error;
    }

    const user = await User.create({
      fullName,
      email,
      password,
      role,
      phone,
      hostelName
    });

    const populatedUser = await User.findById(user._id).populate("room").select("-password");

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: populatedUser
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
    const user = await User.findOne({ email }).populate("room");

    if (!user || !(await user.matchPassword(password))) {
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      throw error;
    }

    if (role && user.role !== role) {
      const error = new Error("Role mismatch for this account");
      error.statusCode = 401;
      throw error;
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        ...user.toObject(),
        password: undefined
      }
    });
  } catch (error) {
    next(error);
  }
};

