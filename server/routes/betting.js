const express = require('express');
const router = express.Router();
const Bet = require('../models/Bet');
const User = require('../models/User');
const Event = require('../models/Event');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Place a new bet
router.post('/', async (req, res) => {
  try {
    const { eventId, betType, amount, odds, selection } = req.body;

    if (!eventId || !betType || !amount || !odds || !selection) {
      return res.status(400).json({
        success: false,
        message: 'All bet fields are required'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Bet amount must be greater than 0'
      });
    }

    // Get user and check balance
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }

    // Check if event exists and is active
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Event is not available for betting'
      });
    }

    // Check if event has started
    if (new Date() > event.startTime) {
      return res.status(400).json({
        success: false,
        message: 'Betting is closed for this event'
      });
    }

    // Create the bet
    const bet = new Bet({
      userId: req.user.id,
      eventId,
      betType,
      amount: parseFloat(amount),
      odds: parseFloat(odds),
      selection,
      potentialPayout: parseFloat(amount) * parseFloat(odds),
      status: 'pending'
    });

    // Deduct amount from user balance
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { balance: -parseFloat(amount) }
    });

    await bet.save();

    // Populate bet with event details
    await bet.populate('eventId', 'title teams startTime sport');

    res.status(201).json({
      success: true,
      message: 'Bet placed successfully',
      data: bet
    });
  } catch (error) {
    console.error('Place bet error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get user's betting history
router.get('/history', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    let query = { userId: req.user.id };
    if (status) {
      query.status = status;
    }

    const bets = await Bet.find(query)
      .populate('eventId', 'title teams startTime sport status result')
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
    console.error('Get betting history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get single bet details
router.get('/:id', async (req, res) => {
  try {
    const bet = await Bet.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate('eventId', 'title teams startTime sport status result');

    if (!bet) {
      return res.status(404).json({
        success: false,
        message: 'Bet not found'
      });
    }

    res.json({
      success: true,
      data: bet
    });
  } catch (error) {
    console.error('Get bet error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Cancel pending bet
router.delete('/:id', async (req, res) => {
  try {
    const bet = await Bet.findOne({
      _id: req.params.id,
      userId: req.user.id,
      status: 'pending'
    });

    if (!bet) {
      return res.status(404).json({
        success: false,
        message: 'Bet not found or cannot be cancelled'
      });
    }

    // Check if event has started
    const event = await Event.findById(bet.eventId);
    if (event && new Date() > event.startTime) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel bet after event has started'
      });
    }

    // Refund the bet amount
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { balance: bet.amount }
    });

    // Update bet status
    bet.status = 'cancelled';
    await bet.save();

    res.json({
      success: true,
      message: 'Bet cancelled successfully',
      data: bet
    });
  } catch (error) {
    console.error('Cancel bet error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get user betting statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await Bet.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          totalPayout: { $sum: '$payout' }
        }
      }
    ]);

    const totalBets = await Bet.countDocuments({ userId });
    const totalStaked = await Bet.aggregate([
      { $match: { userId } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalWinnings = await Bet.aggregate([
      { $match: { userId, status: 'won' } },
      { $group: { _id: null, total: { $sum: '$payout' } } }
    ]);

    const recentBets = await Bet.find({ userId })
      .populate('eventId', 'title teams startTime sport')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        totalBets,
        totalStaked: totalStaked[0]?.total || 0,
        totalWinnings: totalWinnings[0]?.total || 0,
        statusBreakdown: stats,
        recentBets
      }
    });
  } catch (error) {
    console.error('Get betting stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Admin: Get all bets
router.get('/admin/all', requireRole(['admin']), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const userId = req.query.userId;

    let query = {};
    if (status) query.status = status;
    if (userId) query.userId = userId;

    const bets = await Bet.find(query)
      .populate('userId', 'username email firstName lastName')
      .populate('eventId', 'title teams startTime sport status result')
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
    console.error('Admin get bets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Admin: Settle bet
router.put('/admin/:id/settle', requireRole(['admin']), async (req, res) => {
  try {
    const { result, payout } = req.body; // result: 'won' or 'lost'

    if (!['won', 'lost'].includes(result)) {
      return res.status(400).json({
        success: false,
        message: 'Result must be won or lost'
      });
    }

    const bet = await Bet.findById(req.params.id).populate('userId');
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
      const payoutAmount = payout || bet.potentialPayout;
      bet.payout = payoutAmount;

      // Add winnings to user balance
      await User.findByIdAndUpdate(bet.userId._id, {
        $inc: { balance: payoutAmount }
      });
    }

    await bet.save();

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

// Admin: Get betting analytics
router.get('/admin/analytics', requireRole(['admin']), async (req, res) => {
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

    const totalBets = await Bet.countDocuments(dateFilter);
    const totalVolume = await Bet.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalPayouts = await Bet.aggregate([
      { $match: { ...dateFilter, status: 'won' } },
      { $group: { _id: null, total: { $sum: '$payout' } } }
    ]);

    const betsByStatus = await Bet.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          volume: { $sum: '$amount' }
        }
      }
    ]);

    const topBettors = await Bet.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$userId',
          totalBets: { $sum: 1 },
          totalStaked: { $sum: '$amount' }
        }
      },
      { $sort: { totalStaked: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalBets,
        totalVolume: totalVolume[0]?.total || 0,
        totalPayouts: totalPayouts[0]?.total || 0,
        netRevenue: (totalVolume[0]?.total || 0) - (totalPayouts[0]?.total || 0),
        betsByStatus,
        topBettors
      }
    });
  } catch (error) {
    console.error('Get betting analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
