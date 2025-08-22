const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { authenticateToken, requireRole } = require("../middleware/auth");
const bcrypt = require("bcryptjs");

// Get current user profile
router.get("/profile", async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Update current user profile
router.put("/profile", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, dateOfBirth } = req.body;

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({
        email,
        _id: { $ne: req.user.id },
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email is already registered",
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true },
    ).select("-password");

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Change password
router.put("/change-password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await User.findByIdAndUpdate(req.user.id, {
      password: hashedNewPassword,
      updatedAt: new Date(),
    });

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Get user balance
router.get("/balance", async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("balance");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: {
        balance: user.balance || 0,
      },
    });
  } catch (error) {
    console.error("Get balance error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Get all users (Admin only)
router.get("/", requireRole(["admin"]), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const status = req.query.status;

    // Build search query
    let query = {};
    if (search) {
      query = {
        $or: [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { username: { $regex: search, $options: "i" } },
        ],
      };
    }

    if (status) {
      query.status = status;
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Get user by ID (Admin only)
router.get("/:id", requireRole(["admin"]), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Update user status (Admin only)
router.put("/:id/status", requireRole(["admin"]), async (req, res) => {
  try {
    const { status } = req.body;

    if (!["active", "suspended", "banned"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be active, suspended, or banned",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        status,
        updatedAt: new Date(),
      },
      { new: true },
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User status updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Update user status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Update user balance (Admin only)
router.put("/:id/balance", requireRole(["admin"]), async (req, res) => {
  try {
    const { amount, action } = req.body; // action: 'add' or 'subtract' or 'set'

    if (!amount || !action) {
      return res.status(400).json({
        success: false,
        message: "Amount and action are required",
      });
    }

    if (!["add", "subtract", "set"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Must be add, subtract, or set",
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let newBalance;
    switch (action) {
      case "add":
        newBalance = (user.balance || 0) + parseFloat(amount);
        break;
      case "subtract":
        newBalance = (user.balance || 0) - parseFloat(amount);
        break;
      case "set":
        newBalance = parseFloat(amount);
        break;
    }

    // Ensure balance doesn't go negative
    if (newBalance < 0) {
      return res.status(400).json({
        success: false,
        message: "Balance cannot be negative",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        balance: newBalance,
        updatedAt: new Date(),
      },
      { new: true },
    ).select("-password");

    res.json({
      success: true,
      message: "User balance updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update user balance error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Delete user (Admin only)
router.delete("/:id", requireRole(["admin"]), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Don't allow deletion of other admin users
    if (user.role === "admin" && req.user.id !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: "Cannot delete other admin users",
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;
