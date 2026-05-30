const express = require('express');
const { login, registerAdmin, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/login', login);
router.post('/register-admin', registerAdmin);
router.get('/me', protect, getMe);

module.exports = router;
