const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Bet = require('../models/Bet');
const Event = require('../models/Event');
const { requireRole } = require('../middleware/auth');

// All admin routes require admin role
router.use(requireRole(['admin']));

// Dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const totalBets = await Bet.countDocuments();
    const pendingBets = await Bet.countDocuments({ status: 'pending' });
    const totalEvents = await Event.countDocuments();
    const activeEvents = await Event.countDocuments({ status: 'active' });

    // Total betting volume
    const totalVolume = await Bet.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Total payouts
    const totalPayouts = await Bet.aggregate([
      { $match: { status: 'won' } },
      { $group: { _id: null, total: { $sum: '$payout' } } }
    ]);

    // Recent activity
    const recentBets = await Bet.find()
      .populate('userId', 'username email')
      .populate('eventId', 'title teams')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentUsers = await User.find()
      .select('username email createdAt status')
      .sort({ createdAt: -1 })
      .limit(5);

    // Revenue by day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyRevenue = await Bet.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          volume: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        statistics: {
          totalUsers,
          activeUsers,
          totalBets,
          pendingBets,
          totalEvents,
          activeEvents,
          totalVolume: totalVolume[0]?.total || 0,
          totalPayouts: totalPayouts[0]?.total || 0,
          netRevenue: (totalVolume[0]?.total || 0) - (totalPayouts[0]?.total || 0)
        },
        recentActivity: {
          bets: recentBets,
          users: recentUsers
        },
        dailyRevenue
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// User management
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status;
    const role = req.query.role;

    let query = {};
    if (search) {
      query = {
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { username: { $regex: search, $options: 'i' } }
        ]
      };
    }

    if (status) query.status = status;
    if (role) query.role = role;

    const users = await User.find(query)
      .select('-password')
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
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update user details
router.put('/users/:id', async (req, res) => {
  try {
    const { firstName, lastName, email, status, role, balance } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        firstName,
        lastName,
        email,
        status,
        role,
        balance: parseFloat(balance),
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow deletion of other admin users
    if (user.role === 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete other admin users'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Bet management
router.get('/bets', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const userId = req.query.userId;
    const eventId = req.query.eventId;

    let query = {};
    if (status) query.status = status;
    if (userId) query.userId = userId;
    if (eventId) query.eventId = eventId;

    const bets = await Bet.find(query)
      .populate('userId', 'username email firstName lastName')
      .populate('eventId', 'title teams startTime sport status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Bet.countDocuments(query);

    res.json({
      success: true,
      data: {
        bets,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get bets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Settle bet
router.put('/bets/:id/settle', async (req, res) => {
  try {
    const { result } = req.body; // 'won' or 'lost'

    if (!['won', 'lost'].includes(result)) {
      return res.status(400).json({
        success: false,
        message: 'Result must be won or lost'
      });
    }

    const bet = await Bet.findById(req.params.id);
    if (!bet) {
      return res.status(404).json({
        success: false,
        message: 'Bet not found'
      });
    }

    if (bet.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Bet is already settled'
      });
    }

    bet.status = result;
    bet.settledAt = new Date();

    if (result === 'won') {
      bet.payout = bet.potentialPayout;

      // Add winnings to user balance
      await User.findByIdAndUpdate(bet.userId, {
        $inc: { balance: bet.potentialPayout }
      });
    }

    await bet.save();

    // Populate for response
    await bet.populate('userId', 'username email');
    await bet.populate('eventId', 'title teams');

    res.json({
      success: true,
      message: 'Bet settled successfully',
      data: bet
    });
  } catch (error) {
    console.error('Settle bet error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Event management
router.get('/events', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const sport = req.query.sport;

    let query = {};
    if (status) query.status = status;
    if (sport) query.sport = sport;

    const events = await Event.find(query)
      .sort({ startTime: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Event.countDocuments(query);

    res.json({
      success: true,
      data: {
        events,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create event
router.post('/events', async (req, res) => {
  try {
    const {
      title,
      description,
      sport,
      teams,
      startTime,
      odds,
      markets
    } = req.body;

    const event = new Event({
      title,
      description,
      sport,
      teams,
      startTime: new Date(startTime),
      odds,
      markets,
      status: 'active',
      createdBy: req.user.id
    });

    await event.save();

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update event
router.put('/events/:id', async (req, res) => {
  try {
    const {
      title,
      description,
      sport,
      teams,
      startTime,
      odds,
      markets,
      status,
      result
    } = req.body;

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        sport,
        teams,
        startTime: startTime ? new Date(startTime) : undefined,
        odds,
        markets,
        status,
        result,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: event
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete event
router.delete('/events/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if there are pending bets on this event
    const pendingBets = await Bet.countDocuments({
      eventId: req.params.id,
      status: 'pending'
    });

    if (pendingBets > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete event with pending bets'
      });
    }

    await Event.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// System reports
router.get('/reports/financial', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    // Revenue calculation
    const totalBetsVolume = await Bet.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalPayouts = await Bet.aggregate([
      { $match: { ...dateFilter, status: 'won' } },
      { $group: { _id: null, total: { $sum: '$payout' } } }
    ]);

    // Daily breakdown
    const dailyBreakdown = await Bet.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          betsCount: { $sum: 1 },
          volume: { $sum: '$amount' },
          winningBets: {
            $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] }
          },
          payouts: {
            $sum: { $cond: [{ $eq: ['$status', 'won'] }, '$payout', 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalVolume: totalBetsVolume[0]?.total || 0,
          totalPayouts: totalPayouts[0]?.total || 0,
          grossRevenue: (totalBetsVolume[0]?.total || 0) - (totalPayouts[0]?.total || 0)
        },
        dailyBreakdown
      }
    });
  } catch (error) {
    console.error('Financial report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// System settings
router.get('/settings', async (req, res) => {
  try {
    // This would typically come from a settings collection
    // For now, return some default settings
    const settings = {
      maxBetAmount: 10000,
      minBetAmount: 1,
      defaultOddsMargin: 0.05,
      maintenanceMode: false,
      registrationEnabled: true,
      betCancellationWindow: 30 // minutes
    };

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update system settings
router.put('/settings', async (req, res) => {
  try {
    const settings = req.body;

    // Here you would typically save to a settings collection
    // For now, just return the updated settings
    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
