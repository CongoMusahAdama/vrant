const crypto = require('crypto');
const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { isValidPhoneInput } = require('../lib/phone');
const { queueWelcomeSms, sendPasswordResetEmail } = require('../lib/accountNotifications');
const { publicSiteUrl } = require('../lib/publicSiteUrl');
const { anonymizeCustomerUser } = require('../lib/customerAccount');

const router = express.Router();

const formatUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  phone: user.phone,
  phoneVerified: Boolean(user.phoneVerified),
  role: user.role,
  addresses: user.addresses,
  wishlist: user.wishlist || [],
  avatar: user.avatar,
  lastLogin: user.lastLogin,
});

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .isLength({ min: 7, max: 20 })
    .withMessage('Please provide a valid phone number')
    .custom((value) => {
      if (!isValidPhoneInput(value)) {
        throw new Error('Please provide a valid phone number');
      }
      return true;
    }),
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array()
      });
    }

    const { name, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone
    });

    // Generate token
    const token = user.getSignedJwtToken();

    queueWelcomeSms(user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: formatUser(user),
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }
    if (error.name === 'ValidationError') {
      const first = Object.values(error.errors)[0];
      return res.status(400).json({
        success: false,
        message: first?.message || 'Validation failed',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error registering user',
    });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array(),
      });
    }

    const email = String(req.body.email).trim().toLowerCase();
    const { password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: formatUser(user),
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in'
    });
  }
});

// Same answer whether or not the email exists, so the endpoint can't be used to find accounts
const RESET_REQUESTED_MESSAGE =
  'If an account exists for that email, a reset link is on its way. Check your inbox.';

// @desc    Email a password reset link
// @route   POST /api/auth/forgot-password
// @access  Public (rate limited)
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const user = await User.findOne({ email: req.body.email, isActive: true });
    if (user) {
      const resetToken = user.getResetPasswordToken();
      await user.save({ validateBeforeSave: false });
      // FRONTEND_URL is the site the customer actually uses (localhost in dev, the live domain in prod)
      const siteBase = (process.env.FRONTEND_URL || publicSiteUrl()).replace(/\/$/, '');
      const resetUrl = `${siteBase}/reset-password/${resetToken}`;
      const sent = await sendPasswordResetEmail(user, resetUrl);
      if (!sent && process.env.NODE_ENV !== 'production') {
        // Local development without Brevo: print the link so the flow can still be tested
        console.log(`[auth] Password reset link for ${user.email}: ${resetUrl}`);
      }
    }

    res.status(200).json({ success: true, message: RESET_REQUESTED_MESSAGE });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Could not start password reset' });
  }
});

// @desc    Set a new password using a reset link token
// @route   POST /api/auth/reset-password/:token
// @access  Public (rate limited)
router.post('/reset-password/:token', [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const hashed = crypto.createHash('sha256').update(String(req.params.token)).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpire: { $gt: Date.now() },
      isActive: true,
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'This reset link is invalid or has expired. Please request a new one.',
      });
    }

    user.password = req.body.password; // hashed by the pre-save hook; also revokes older sessions
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.lastLogin = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated. You are now signed in.',
      data: { user: formatUser(user), token: user.getSignedJwtToken() },
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Could not reset password' });
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      data: {
        user: formatUser(user),
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data'
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('phone').optional({ values: 'null' }).trim(),
  body('addresses').optional().isArray(),
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0]?.msg || 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, phone, addresses } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (name) user.name = name;

    if (email !== undefined) {
      const nextEmail = String(email).trim().toLowerCase();
      if (!nextEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email is required',
        });
      }
      if (nextEmail !== user.email) {
        const taken = await User.findOne({ email: nextEmail, _id: { $ne: user._id } });
        if (taken) {
          return res.status(400).json({
            success: false,
            message: 'That email is already in use',
          });
        }
        user.email = nextEmail;
      }
    }

    if (phone !== undefined) {
      const nextPhone = String(phone).trim();
      if (nextPhone && !isValidPhoneInput(nextPhone)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid phone number',
        });
      }
      const prevPhone = (user.phone || '').trim();
      user.phone = nextPhone || undefined;
      if (nextPhone !== prevPhone) {
        user.phoneVerified = false;
      }
    }

    if (addresses) user.addresses = addresses;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: formatUser(user)
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', protect, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Older tokens are now rejected (passwordChangedAt); hand back a fresh one for this device
    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      data: { token: user.getSignedJwtToken() }
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password'
    });
  }
});

// @desc    Toggle product in wishlist
// @route   POST /api/auth/wishlist/:productId
// @access  Private
router.post('/wishlist/:productId', protect, async (req, res) => {
  try {
    const productId = parseInt(req.params.productId, 10);
    if (Number.isNaN(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product id' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const list = user.wishlist || [];
    const index = list.indexOf(productId);
    let added = false;
    if (index >= 0) {
      list.splice(index, 1);
    } else {
      list.push(productId);
      added = true;
    }
    user.wishlist = list;
    await user.save();

    res.status(200).json({
      success: true,
      data: { wishlist: user.wishlist, added },
    });
  } catch (error) {
    console.error('Wishlist toggle error:', error);
    res.status(500).json({ success: false, message: 'Error updating wishlist' });
  }
});

// @desc    Delete customer account (anonymize — orders are kept for records)
// @route   DELETE /api/auth/account
// @access  Private (customers only)
router.delete('/account', protect, [
  body('password')
    .notEmpty()
    .withMessage('Password is required to delete your account'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array(),
      });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin accounts cannot be deleted from the customer dashboard',
      });
    }

    const isMatch = await user.matchPassword(req.body.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect password',
      });
    }

    await anonymizeCustomerUser(user);

    res.status(200).json({
      success: true,
      message: 'Your account has been deleted',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting account',
    });
  }
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', protect, async (req, res) => {
  try {
    // In a real application, you might want to blacklist the token
    // For now, we'll just return a success message
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging out'
    });
  }
});

module.exports = router;
