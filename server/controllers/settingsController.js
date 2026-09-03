const Settings = require('../models/Settings');
const cloudinary = require('../config/cloudinary');

// @desc    Get public settings
// @route   GET /api/settings/public
// @access  Public
exports.getPublicSettings = async (req, res, next) => {
  try {
    const settings = await Settings.getSettings();
    res.json({
      success: true,
      data: {
        theme: settings.theme,
        supportEmail: settings.supportEmail,
        contactFormEnabled: settings.contactFormEnabled,
        contactFormHeading: settings.contactFormHeading,
        contactFormDescription: settings.contactFormDescription,
        shippingCharge: settings.shippingCharge,
        freeShippingThreshold: settings.freeShippingThreshold,
        minDeliveryDays: settings.minDeliveryDays,
        maxDeliveryDays: settings.maxDeliveryDays,
        privacyPolicyPdfUrl: settings.privacyPolicyPdfUrl,
        privacyPolicyUploadedAt: settings.privacyPolicyUploadedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get full admin settings
// @route   GET /api/settings/admin
// @access  Private/Admin
exports.getAdminSettings = async (req, res, next) => {
  try {
    const settings = await Settings.getSettings();
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update admin settings
// @route   PUT /api/settings/admin
// @access  Private/Admin
exports.updateSettings = async (req, res, next) => {
  try {
    const {
      theme,
      supportEmail,
      contactFormEnabled,
      contactFormHeading,
      contactFormDescription,
      shippingCharge,
      freeShippingThreshold,
      minDeliveryDays,
      maxDeliveryDays
    } = req.body;

    // Email validation
    if (supportEmail) {
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(supportEmail)) {
        return res.status(400).json({ success: false, message: 'Please provide a valid support email address' });
      }
    }

    // Numerical validation
    if (shippingCharge !== undefined && Number(shippingCharge) < 0) {
      return res.status(400).json({ success: false, message: 'Shipping charge cannot be negative' });
    }
    if (freeShippingThreshold !== undefined && Number(freeShippingThreshold) < 0) {
      return res.status(400).json({ success: false, message: 'Free shipping threshold cannot be negative' });
    }
    if (minDeliveryDays !== undefined && Number(minDeliveryDays) < 1) {
      return res.status(400).json({ success: false, message: 'Minimum delivery days must be at least 1 day' });
    }
    if (maxDeliveryDays !== undefined && Number(maxDeliveryDays) < Number(minDeliveryDays || 1)) {
      return res.status(400).json({ success: false, message: 'Maximum delivery days cannot be less than minimum delivery days' });
    }

    let settings = await Settings.getSettings();

    if (theme !== undefined) settings.theme = theme;
    if (supportEmail !== undefined) settings.supportEmail = supportEmail;
    if (contactFormEnabled !== undefined) settings.contactFormEnabled = Boolean(contactFormEnabled);
    if (contactFormHeading !== undefined) settings.contactFormHeading = contactFormHeading;
    if (contactFormDescription !== undefined) settings.contactFormDescription = contactFormDescription;
    if (shippingCharge !== undefined) settings.shippingCharge = Number(shippingCharge);
    if (freeShippingThreshold !== undefined) settings.freeShippingThreshold = Number(freeShippingThreshold);
    if (minDeliveryDays !== undefined) settings.minDeliveryDays = Number(minDeliveryDays);
    if (maxDeliveryDays !== undefined) settings.maxDeliveryDays = Number(maxDeliveryDays);

    await settings.save();

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload Privacy Policy PDF
// @route   POST /api/settings/admin/privacy-policy
// @access  Private/Admin
exports.uploadPrivacyPolicy = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a PDF document file' });
    }

    const fileUrl = req.file.path || req.file.secure_url;
    let settings = await Settings.getSettings();

    settings.privacyPolicyPdfUrl = fileUrl;
    settings.privacyPolicyUploadedAt = new Date();
    await settings.save();

    res.json({
      success: true,
      message: 'Privacy Policy PDF uploaded successfully',
      data: {
        privacyPolicyPdfUrl: settings.privacyPolicyPdfUrl,
        privacyPolicyUploadedAt: settings.privacyPolicyUploadedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete Privacy Policy PDF
// @route   DELETE /api/settings/admin/privacy-policy
// @access  Private/Admin
exports.deletePrivacyPolicy = async (req, res, next) => {
  try {
    let settings = await Settings.getSettings();
    settings.privacyPolicyPdfUrl = '';
    settings.privacyPolicyUploadedAt = null;
    await settings.save();

    res.json({
      success: true,
      message: 'Privacy Policy PDF removed successfully'
    });
  } catch (error) {
    next(error);
  }
};
