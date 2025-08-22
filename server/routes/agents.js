const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Bet = require("../models/Bet");
const { requireRole } = require("../middleware/auth");

// Get agent dashboard data
router.get("/dashboard", requireRole(["agent"]), async (req, res) => {
  try {
    // Get users under this agent
    const agentUsers = await User.find({ agentId: req.user.id }).select(
      "-password",
    );
    const userIds = agentUsers.map((user) => user._id);

    // Get betting statistics for agent's users
    const totalBets = await Bet.countDocuments({ userId: { $in: userIds } });
    const totalVolume = await Bet.aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const totalPayouts = await Bet.aggregate([
      { $match: { userId: { $in: userIds }, status: "won" } },
      { $group: { _id: null, total: { $sum: "$payout" } } },
    ]);

    // Recent bets from agent's users
    const recentBets = await Bet.find({ userId: { $in: userIds } })
      .populate("userId", "username email firstName lastName")
      .populate("eventId", "title teams startTime sport")
      .sort({ createdAt: -1 })
      .limit(10);

    // Commission calculation (typically 10-15% of net revenue)
    const netRevenue =
      (totalVolume[0]?.total || 0) - (totalPayouts[0]?.total || 0);
    const commissionRate = 0.12; // 12% commission
    const estimatedCommission = netRevenue * commissionRate;

    res.json({
      success: true,
      data: {
        statistics: {
          totalUsers: agentUsers.length,
          totalBets,
          totalVolume: totalVolume[0]?.total || 0,
          totalPayouts: totalPayouts[0]?.total || 0,
          netRevenue,
          estimatedCommission,
        },
        recentBets,
        users: agentUsers,
      },
    });
  } catch (error) {
    console.error("Agent dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Get agent's users
router.get("/users", requireRole(["agent"]), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const status = req.query.status;

    let query = { agentId: req.user.id };

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
      ];
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

    // Get betting statistics for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const userBets = await Bet.countDocuments({ userId: user._id });
        const userVolume = await Bet.aggregate([
          { $match: { userId: user._id } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]);

        return {
          ...user.toObject(),
          bettingStats: {
            totalBets: userBets,
            totalVolume: userVolume[0]?.total || 0,
          },
        };
      }),
    );

    res.json({
      success: true,
      data: {
        users: usersWithStats,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get agent users error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Get specific user details (only if user belongs to agent)
router.get("/users/:id", requireRole(["agent"]), async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      agentId: req.user.id,
    }).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found or not authorized",
      });
    }

    // Get user's betting history
    const bettingHistory = await Bet.find({ userId: user._id })
      .populate("eventId", "title teams startTime sport status")
      .sort({ createdAt: -1 })
      .limit(20);

    // Get betting statistics
    const totalBets = await Bet.countDocuments({ userId: user._id });
    const totalVolume = await Bet.aggregate([
      { $match: { userId: user._id } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const totalWinnings = await Bet.aggregate([
      { $match: { userId: user._id, status: "won" } },
      { $group: { _id: null, total: { $sum: "$payout" } } },
    ]);

    res.json({
      success: true,
      data: {
        user,
        bettingHistory,
        statistics: {
          totalBets,
          totalVolume: totalVolume[0]?.total || 0,
          totalWinnings: totalWinnings[0]?.total || 0,
        },
      },
    });
  } catch (error) {
    console.error("Get user details error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Update user balance (agent can add/subtract from their users)
router.put("/users/:id/balance", requireRole(["agent"]), async (req, res) => {
  try {
    const { amount, action, note } = req.body;

    if (!amount || !action) {
      return res.status(400).json({
        success: false,
        message: "Amount and action are required",
      });
    }

    if (!["add", "subtract"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Must be add or subtract",
      });
    }

    const user = await User.findOne({
      _id: req.params.id,
      agentId: req.user.id,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found or not authorized",
      });
    }

    let newBalance;
    if (action === "add") {
      newBalance = (user.balance || 0) + parseFloat(amount);
    } else {
      newBalance = (user.balance || 0) - parseFloat(amount);
    }

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

    // Log the transaction (you might want to create a Transaction model for this)
    console.log(
      `Agent ${req.user.username} ${action}ed ${amount} to user ${user.username}. Note: ${note || "No note"}`,
    );

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

// Update user status (agent can activate/suspend their users)
router.put("/users/:id/status", requireRole(["agent"]), async (req, res) => {
  try {
    const { status } = req.body;

    if (!["active", "suspended"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Agent can only set active or suspended",
      });
    }

    const user = await User.findOneAndUpdate(
      {
        _id: req.params.id,
        agentId: req.user.id,
      },
      {
        status,
        updatedAt: new Date(),
      },
      { new: true },
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found or not authorized",
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

// Get agent's betting reports
router.get("/reports", requireRole(["agent"]), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Get users under this agent
    const agentUsers = await User.find({ agentId: req.user.id }).select("_id");
    const userIds = agentUsers.map((user) => user._id);

    let dateFilter = { userId: { $in: userIds } };
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Betting volume by user
    const volumeByUser = await Bet.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$userId",
          totalBets: { $sum: 1 },
          totalVolume: { $sum: "$amount" },
          totalWinnings: {
            $sum: { $cond: [{ $eq: ["$status", "won"] }, "$payout", 0] },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $sort: { totalVolume: -1 } },
    ]);

    // Daily breakdown
    const dailyBreakdown = await Bet.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          betsCount: { $sum: 1 },
          volume: { $sum: "$amount" },
          payouts: {
            $sum: { $cond: [{ $eq: ["$status", "won"] }, "$payout", 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Summary statistics
    const totalBets = await Bet.countDocuments(dateFilter);
    const totalVolume = await Bet.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const totalPayouts = await Bet.aggregate([
      { $match: { ...dateFilter, status: "won" } },
      { $group: { _id: null, total: { $sum: "$payout" } } },
    ]);

    const netRevenue =
      (totalVolume[0]?.total || 0) - (totalPayouts[0]?.total || 0);
    const commissionRate = 0.12;
    const estimatedCommission = netRevenue * commissionRate;

    res.json({
      success: true,
      data: {
        summary: {
          totalBets,
          totalVolume: totalVolume[0]?.total || 0,
          totalPayouts: totalPayouts[0]?.total || 0,
          netRevenue,
          estimatedCommission,
        },
        volumeByUser,
        dailyBreakdown,
      },
    });
  } catch (error) {
    console.error("Agent reports error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Admin: Get all agents
router.get("/admin/all", requireRole(["admin"]), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const agents = await User.find({ role: "agent" })
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments({ role: "agent" });

    // Get statistics for each agent
    const agentsWithStats = await Promise.all(
      agents.map(async (agent) => {
        const userCount = await User.countDocuments({ agentId: agent._id });
        const userIds = await User.find({ agentId: agent._id }).select("_id");
        const ids = userIds.map((u) => u._id);

        const totalBets = await Bet.countDocuments({ userId: { $in: ids } });
        const totalVolume = await Bet.aggregate([
          { $match: { userId: { $in: ids } } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]);

        return {
          ...agent.toObject(),
          statistics: {
            userCount,
            totalBets,
            totalVolume: totalVolume[0]?.total || 0,
          },
        };
      }),
    );

    res.json({
      success: true,
      data: {
        agents: agentsWithStats,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get all agents error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Admin: Create new agent
router.post("/admin/create", requireRole(["admin"]), async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email, and password are required",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email or username already exists",
      });
    }

    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 12);

    const agent = new User({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: "agent",
      status: "active",
    });

    await agent.save();

    res.status(201).json({
      success: true,
      message: "Agent created successfully",
      data: {
        id: agent._id,
        username: agent.username,
        email: agent.email,
        role: agent.role,
        status: agent.status,
      },
    });
  } catch (error) {
    console.error("Create agent error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;
