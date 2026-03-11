import Payment from "../models/Payment.js";

export const createPayment = async (req, res, next) => {
  try {
    const payment = await Payment.create({
      ...req.body,
      student: req.user.role === "student" ? req.user._id : req.body.student,
      proofUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
      paidAt: req.body.paidAt || new Date(),
      status: req.file ? "under review" : "pending"
    });

    const populatedPayment = await Payment.findById(payment._id)
      .populate("student", "fullName email")
      .populate("verifiedBy", "fullName");

    res.status(201).json({ success: true, payment: populatedPayment });
  } catch (error) {
    next(error);
  }
};

export const getPayments = async (req, res, next) => {
  try {
    const query = req.user.role === "owner" ? {} : { student: req.user._id };
    const payments = await Payment.find(query)
      .populate("student", "fullName email")
      .populate("verifiedBy", "fullName")
      .sort({ createdAt: -1 });

    res.json({ success: true, payments });
  } catch (error) {
    next(error);
  }
};

export const verifyPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      const error = new Error("Payment not found");
      error.statusCode = 404;
      throw error;
    }

    payment.status = req.body.status || payment.status;
    payment.notes = req.body.notes ?? payment.notes;
    payment.verifiedBy = req.user._id;
    await payment.save();

    const updatedPayment = await Payment.findById(req.params.id)
      .populate("student", "fullName email")
      .populate("verifiedBy", "fullName");

    res.json({ success: true, payment: updatedPayment });
  } catch (error) {
    next(error);
  }
};

