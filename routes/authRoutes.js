const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
  registerUser, 
  loginUser,
  verifyEmail,
  getUserProfile,
  updateUserProfile,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const validate = require('../middleware/validationMiddleware');
const {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  resetPasswordValidation,
} = require('../middleware/validationRules');

router.post('/register', validate(registerValidation), registerUser);
router.post('/login', validate(loginValidation), loginUser);
router.get('/verify-email/:token', verifyEmail);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, validate(updateProfileValidation), updateUserProfile);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', validate(resetPasswordValidation), resetPassword);

module.exports = router;
