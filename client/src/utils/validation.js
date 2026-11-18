/**
 * Form Validation Utilities for Coinomart
 */

// Email regex according to HTML5 standard / common RFC 5322 subset
export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// Phone regex: 10 digits for Indian mobile numbers or standard international format with optional +
export const PHONE_REGEX = /^(\+91[\-\s]?)?[6789]\d{9}$|^(\+\d{1,3}[\-\s]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;

// Indian 6-digit postal PIN code
export const PINCODE_REGEX = /^[1-9][0-9]{5}$/;

export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
};

export const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15 && /^[+]?[0-9]+$/.test(cleaned);
};

export const isValidPincode = (pin) => {
  if (!pin || typeof pin !== 'string') return false;
  return PINCODE_REGEX.test(pin.trim());
};

export const isValidPassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  return password.length >= 6;
};

/**
 * Validate Login Form
 */
export const validateLoginForm = (formData) => {
  const errors = {};

  if (!formData.email || !formData.email.trim()) {
    errors.email = 'Email address is required';
  } else if (!isValidEmail(formData.email)) {
    errors.email = 'Please enter a valid email address (e.g. user@example.com)';
  }

  if (!formData.password) {
    errors.password = 'Password is required';
  } else if (formData.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate Register Form
 */
export const validateRegisterForm = (formData) => {
  const errors = {};

  if (!formData.name || !formData.name.trim()) {
    errors.name = 'Full name is required';
  } else if (formData.name.trim().length < 2) {
    errors.name = 'Full name must be at least 2 characters';
  }

  if (!formData.email || !formData.email.trim()) {
    errors.email = 'Email address is required';
  } else if (!isValidEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!formData.password) {
    errors.password = 'Password is required';
  } else if (formData.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  if (!formData.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  if (formData.terms !== undefined && !formData.terms) {
    errors.terms = 'You must agree to the Terms of Service and Privacy Policy';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate Forgot Password Form
 */
export const validateForgotPasswordForm = (email) => {
  const errors = {};

  if (!email || !email.trim()) {
    errors.email = 'Email address is required';
  } else if (!isValidEmail(email)) {
    errors.email = 'Please enter a valid email address';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate Reset Password Form
 */
export const validateResetPasswordForm = (formData) => {
  const errors = {};

  if (!formData.password) {
    errors.password = 'New password is required';
  } else if (formData.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  if (!formData.confirmPassword) {
    errors.confirmPassword = 'Confirm new password is required';
  } else if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate Profile Form
 */
export const validateProfileForm = (formData) => {
  const errors = {};

  if (!formData.name || !formData.name.trim()) {
    errors.name = 'Full name is required';
  } else if (formData.name.trim().length < 2) {
    errors.name = 'Full name must be at least 2 characters';
  }

  if (formData.phone && formData.phone.trim()) {
    if (!isValidPhone(formData.phone)) {
      errors.phone = 'Please enter a valid phone number (e.g. 9876543210)';
    }
  }

  if (formData.zipCode && formData.zipCode.trim()) {
    if (!isValidPincode(formData.zipCode)) {
      errors.zipCode = 'Please enter a valid 6-digit PIN code';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate Checkout Shipping Address
 */
export const validateCheckoutAddress = (address) => {
  const errors = {};

  if (!address.street || !address.street.trim()) {
    errors.street = 'Street address is required';
  } else if (address.street.trim().length < 5) {
    errors.street = 'Please provide a complete street address (min 5 characters)';
  }

  if (!address.city || !address.city.trim()) {
    errors.city = 'City is required';
  } else if (address.city.trim().length < 2) {
    errors.city = 'City name is too short';
  }

  if (!address.state || !address.state.trim()) {
    errors.state = 'State is required';
  } else if (address.state.trim().length < 2) {
    errors.state = 'State name is too short';
  }

  if (!address.zipCode || !address.zipCode.trim()) {
    errors.zipCode = 'PIN / Zip code is required';
  } else if (!isValidPincode(address.zipCode)) {
    errors.zipCode = 'Please enter a valid 6-digit PIN code (e.g. 400001)';
  }

  if (!address.phone || !address.phone.trim()) {
    errors.phone = 'Contact phone number is required for shipping';
  } else if (!isValidPhone(address.phone)) {
    errors.phone = 'Please enter a valid 10-digit mobile number';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate Support Inquiry Form
 */
export const validateSupportForm = (formData) => {
  const errors = {};

  if (!formData.name || !formData.name.trim()) {
    errors.name = 'Your name is required';
  } else if (formData.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  if (!formData.email || !formData.email.trim()) {
    errors.email = 'Email address is required';
  } else if (!isValidEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!formData.subject || !formData.subject.trim()) {
    errors.subject = 'Subject is required';
  } else if (formData.subject.trim().length < 3) {
    errors.subject = 'Subject must be at least 3 characters';
  }

  if (!formData.message || !formData.message.trim()) {
    errors.message = 'Inquiry message is required';
  } else if (formData.message.trim().length < 10) {
    errors.message = 'Please provide more details in your message (at least 10 characters)';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate Customer Review Form
 */
export const validateReviewForm = (formData) => {
  const errors = {};

  if (!formData.rating || formData.rating < 1 || formData.rating > 5) {
    errors.rating = 'Please select a rating between 1 and 5 stars';
  }

  if (!formData.name || !formData.name.trim()) {
    errors.name = 'Your name is required';
  } else if (formData.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  if (formData.email && formData.email.trim() && !isValidEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!formData.title || !formData.title.trim()) {
    errors.title = 'Review headline is required';
  } else if (formData.title.trim().length < 3) {
    errors.title = 'Headline must be at least 3 characters';
  }

  if (!formData.comment || !formData.comment.trim()) {
    errors.comment = 'Review commentary is required';
  } else if (formData.comment.trim().length < 10) {
    errors.comment = 'Please share more details (at least 10 characters)';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate Admin Coin Form
 */
export const validateCoinForm = (formData) => {
  const errors = {};

  if (!formData.name || !formData.name.trim()) {
    errors.name = 'Artifact name is required';
  } else if (formData.name.trim().length < 3) {
    errors.name = 'Artifact name must be at least 3 characters';
  }

  if (!formData.year || !formData.year.trim()) {
    errors.year = 'Year of issue is required';
  }

  if (!formData.category) {
    errors.category = 'Please select a category';
  }

  if (!formData.era) {
    errors.era = 'Please select a historical era';
  }

  if (!formData.country) {
    errors.country = 'Please select a country of origin';
  }

  if (!formData.condition) {
    errors.condition = 'Please select a numismatic condition grade';
  }

  if (formData.price === '' || formData.price === null || formData.price === undefined) {
    errors.price = 'Selling price is required';
  } else if (Number(formData.price) <= 0) {
    errors.price = 'Selling price must be greater than ₹0';
  }

  if (formData.quantity === '' || formData.quantity === null || formData.quantity === undefined) {
    errors.quantity = 'Quantity is required';
  } else if (Number(formData.quantity) < 0 || !Number.isInteger(Number(formData.quantity))) {
    errors.quantity = 'Quantity must be a non-negative whole integer';
  }

  if (formData.weight && Number(formData.weight) <= 0) {
    errors.weight = 'Weight must be a positive number';
  }

  if (formData.diameter && Number(formData.diameter) <= 0) {
    errors.diameter = 'Diameter must be a positive number';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
