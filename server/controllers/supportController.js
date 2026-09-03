const SupportInquiry = require('../models/SupportInquiry');

// @desc    Submit a support inquiry (client)
// @route   POST /api/support
// @access  Public
exports.createInquiry = async (req, res, next) => {
  try {
    const { name, email, orderId, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (Name, Email, Subject, Message)'
      });
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    const inquiry = await SupportInquiry.create({
      name,
      email,
      orderId: orderId || '',
      subject,
      message,
      user: req.user ? req.user._id : null
    });

    res.status(201).json({
      success: true,
      message: 'Your support request has been submitted successfully. Our support team will get back to you soon.',
      data: inquiry
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get support inquiries (admin)
// @route   GET /api/support/admin
// @access  Private/Admin
exports.getInquiries = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const filter = {};

    if (status && ['pending', 'in_progress', 'resolved'].includes(status)) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { orderId: { $regex: search, $options: 'i' } }
      ];
    }

    const inquiries = await SupportInquiry.find(filter)
      .sort({ createdAt: -1 })
      .populate('user', 'name email');

    res.json({
      success: true,
      count: inquiries.length,
      data: inquiries
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update support inquiry status / admin reply
// @route   PUT /api/support/admin/:id
// @access  Private/Admin
exports.updateInquiry = async (req, res, next) => {
  try {
    const { status, adminReply } = req.body;
    let inquiry = await SupportInquiry.findById(req.params.id);

    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Support inquiry not found' });
    }

    if (status && ['pending', 'in_progress', 'resolved'].includes(status)) {
      inquiry.status = status;
    }

    if (adminReply !== undefined) {
      inquiry.adminReply = adminReply;
      inquiry.repliedAt = new Date();
    }

    await inquiry.save();

    res.json({
      success: true,
      message: 'Support inquiry updated successfully',
      data: inquiry
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete support inquiry
// @route   DELETE /api/support/admin/:id
// @access  Private/Admin
exports.deleteInquiry = async (req, res, next) => {
  try {
    const inquiry = await SupportInquiry.findByIdAndDelete(req.params.id);

    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Support inquiry not found' });
    }

    res.json({
      success: true,
      message: 'Support inquiry deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
