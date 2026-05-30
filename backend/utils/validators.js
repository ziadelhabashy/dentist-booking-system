const validator = require('validator');

const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return validator.escape(validator.trim(str));
};

const validateEmail = (email) => validator.isEmail(email);

const validatePhone = (phone) => {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return /^\+?[0-9]{10,15}$/.test(cleaned);
};

const validateFutureDate = (date) => {
  const appointmentDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return appointmentDate >= today;
};

module.exports = {
  sanitizeString,
  validateEmail,
  validatePhone,
  validateFutureDate,
};
