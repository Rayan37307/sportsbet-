const express = require("express");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const {
  asyncHandler,
  ValidationError,
  AuthenticationError,
} = require("../middleware/errorHandler");

const router = express.Router();

// Validation rules
const registerValidation = [
  body("username")
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),

  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one lowercase letter, one uppercase letter, and one number",
    ),

  body("firstName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters"),

  body("lastName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters"),

  body("phone")
    .optional()
    .isMobilePhone()
    .withMessage("Please provide a valid phone number"),

  body("dateOfBirth")
    .optional()
    .isISO8601()
    .withMessage("Please provide a valid date of birth"),

  body("referralCode")
    .optional()
    .isString()
    .withMessage("Referral code must be a string"),
];

const loginValidation = [
  body("username").notEmpty().withMessage("Username or email is required"),

  body("password").notEmpty().withMessage("Password is required"),
];

const passwordResetValidation = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
];

const passwordChangeValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "New password must contain at least one lowercase letter, one uppercase letter, and one number",
    ),
];

// Helper function to generate tokens
const generateTokens = (userId, role) => {
  const accessToken = jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "1h",
  });

  const refreshToken = jwt.sign(
    { userId, role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || "7d" },
  );

  return { accessToken, refreshToken };
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  "/register",
  registerValidation,
  asyncHandler(async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError("Validation failed", errors.array());
    }

    const {
      username,
      email,
      password,
      firstName,
      lastName,
      phone,
      dateOfBirth,
      referralCode,
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      if (existingUser.username === username) {
        throw new ValidationError("Username already exists");
      }
      if (existingUser.email === email) {
        throw new ValidationError("Email already exists");
      }
    }

    // Handle referral code
    let parentAgent = null;
    if (referralCode) {
      const referrer = await User.findOne({
        $or: [{ username: referralCode }, { referralCode: referralCode }],
        role: { $in: ["agent", "sub_agent"] },
      });

      if (referrer) {
        parentAgent = referrer._id;
      }
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      phone,
      dateOfBirth,
      parentAgent,
      role: "player", // Default role
      commissionRate: 0, // Players don't earn commission
    });

    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id, user.role);

    // Update referrer's players list if applicable
    if (parentAgent) {
      await User.findByIdAndUpdate(parentAgent, {
        $push: { players: user._id },
      });
    }

    // Remove password from response and add computed status
    const userResponse = user.toObject();
    delete userResponse.password;

    // Add computed status field based on boolean flags
    if (userResponse.isBlocked) {
      userResponse.status = "banned";
    } else if (!userResponse.isActive) {
      userResponse.status = "suspended";
    } else {
      userResponse.status = "active";
    }

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: userResponse,
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  }),
);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  "/login",
  loginValidation,
  asyncHandler(async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError("Validation failed", errors.array());
    }

    const { username, password } = req.body;

    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username }, { email: username }],
    });

    if (!user) {
      throw new AuthenticationError("Invalid credentials");
    }

    // Check if account is locked
    if (user.isLocked()) {
      throw new AuthenticationError(
        "Account is temporarily locked due to multiple failed login attempts",
      );
    }

    // Check if account is active
    if (!user.isActive) {
      throw new AuthenticationError("Account is deactivated");
    }

    if (user.isBlocked) {
      throw new AuthenticationError("Account is blocked");
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Increment login attempts
      await user.incLoginAttempts();
      throw new AuthenticationError("Invalid credentials");
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id, user.role);

    // Remove password from response and add computed status
    const userResponse = user.toObject();
    delete userResponse.password;

    // Add computed status field based on boolean flags
    if (userResponse.isBlocked) {
      userResponse.status = "banned";
    } else if (!userResponse.isActive) {
      userResponse.status = "suspended";
    } else {
      userResponse.status = "active";
    }

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: userResponse,
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  }),
);

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ValidationError("Refresh token is required");
    }

    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      // Check if user exists and is active
      const user = await User.findById(decoded.userId).select("-password");

      if (!user || !user.isActive) {
        throw new AuthenticationError("Invalid refresh token");
      }

      // Generate new tokens
      const tokens = generateTokens(user._id, user.role);

      res.json({
        success: true,
        message: "Token refreshed successfully",
        data: {
          tokens,
        },
      });
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new AuthenticationError("Refresh token expired");
      }
      throw new AuthenticationError("Invalid refresh token");
    }
  }),
);

// @route   POST /api/auth/logout
// @desc    Logout user (invalidate token)
// @access  Private
router.post(
  "/logout",
  asyncHandler(async (req, res) => {
    // In a stateless JWT system, logout is typically handled client-side
    // by removing the token. For additional security, you could implement
    // a token blacklist using Redis.

    res.json({
      success: true,
      message: "Logout successful",
    });
  }),
);

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post(
  "/forgot-password",
  passwordResetValidation,
  asyncHandler(async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError("Validation failed", errors.array());
    }

    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent",
      });
    }

    // Generate reset token (you could use crypto.randomBytes for better security)
    const resetToken = Math.random().toString(36).substr(2, 15);
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Store reset token in user document
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // TODO: Send email with reset link
    // This would integrate with your email service (SendGrid, AWS SES, etc.)

    res.json({
      success: true,
      message:
        "If an account with that email exists, a password reset link has been sent",
    });
  }),
);

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post(
  "/reset-password",
  asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      throw new ValidationError("Token and new password are required");
    }

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new ValidationError("Invalid or expired reset token");
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Password reset successful",
    });
  }),
);

// @route   POST /api/auth/change-password
// @desc    Change password (authenticated user)
// @access  Private
router.post(
  "/change-password",
  passwordChangeValidation,
  asyncHandler(async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError("Validation failed", errors.array());
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    // Get user with password
    const user = await User.findById(userId);

    if (!user) {
      throw new AuthenticationError("User not found");
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new ValidationError("Current password is incorrect");
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  }),
);

// @route   POST /api/auth/verify-email
// @desc    Verify email address
// @access  Public
router.post(
  "/verify-email",
  asyncHandler(async (req, res) => {
    const { token } = req.body;

    if (!token) {
      throw new ValidationError("Verification token is required");
    }

    // Find user with verification token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new ValidationError("Invalid or expired verification token");
    }

    // Mark email as verified
    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Email verified successfully",
    });
  }),
);

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get(
  "/me",
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("-password");

    // Add computed status field based on boolean flags
    const userResponse = user.toObject();
    if (userResponse.isBlocked) {
      userResponse.status = "banned";
    } else if (!userResponse.isActive) {
      userResponse.status = "suspended";
    } else {
      userResponse.status = "active";
    }

    res.json({
      success: true,
      data: {
        user: userResponse,
      },
    });
  }),
);

module.exports = router;
