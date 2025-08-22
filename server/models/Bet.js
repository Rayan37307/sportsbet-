const mongoose = require('mongoose');

const betSchema = new mongoose.Schema({
  // User and Bet Information
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  betSlipId: {
    type: String,
    required: true,
    unique: true
  },
  betType: {
    type: String,
    enum: ['single', 'multiple', 'system', 'live'],
    required: true
  },
  stake: {
    type: Number,
    required: true,
    min: 0.01
  },
  totalOdds: {
    type: Number,
    required: true,
    min: 1.0
  },
  potentialWin: {
    type: Number,
    required: true,
    min: 0
  },

  // Selections (for multiple bets)
  selections: [{
    sport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sport',
      required: true
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    },
    market: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Market',
      required: true
    },
    selection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Selection',
      required: true
    },
    odds: {
      type: Number,
      required: true,
      min: 1.0
    },
    status: {
      type: String,
      enum: ['pending', 'won', 'lost', 'void', 'cancelled'],
      default: 'pending'
    },
    result: {
      type: String,
      enum: ['win', 'loss', 'void', 'pending'],
      default: 'pending'
    }
  }],

  // Bet Status and Results
  status: {
    type: String,
    enum: ['pending', 'active', 'won', 'lost', 'void', 'cancelled', 'settled'],
    default: 'pending'
  },
  result: {
    type: String,
    enum: ['win', 'loss', 'void', 'pending'],
    default: 'pending'
  },
  settledAt: Date,
  settledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Financial Details
  payout: {
    amount: {
      type: Number,
      default: 0
    },
    processedAt: Date,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction'
    }
  },

  // Commission and Agent Details
  agentCommission: {
    type: Number,
    default: 0
  },
  subAgentCommission: {
    type: Number,
    default: 0
  },
  commissionPaid: {
    type: Boolean,
    default: false
  },

  // Live Betting
  isLive: {
    type: Boolean,
    default: false
  },
  liveOdds: {
    type: Number
  },
  liveScore: {
    home: Number,
    away: Number
  },

  // Risk Management
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  maxStake: {
    type: Number
  },
  minStake: {
    type: Number
  },

  // Betting Rules
  rules: {
    allowCashOut: {
      type: Boolean,
      default: false
    },
    allowPartialCashOut: {
      type: Boolean,
      default: false
    },
    cashOutValue: {
      type: Number
    }
  },

  // Cash Out
  cashOut: {
    isAvailable: {
      type: Boolean,
      default: false
    },
    currentValue: {
      type: Number
    },
    isProcessed: {
      type: Boolean,
      default: false
    },
    processedAt: Date,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },

  // Validation and Verification
  validationErrors: [{
    field: String,
    message: String,
    code: String
  }],
  isValid: {
    type: Boolean,
    default: true
  },

  // Metadata
  ipAddress: String,
  userAgent: String,
  deviceInfo: {
    type: String,
    platform: String,
    browser: String
  },

  // Timestamps
  placedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: Date,
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
betSchema.index({ user: 1 });
betSchema.index({ status: 1 });
betSchema.index({ betSlipId: 1 });
betSchema.index({ placedAt: -1 });
betSchema.index({ 'selections.event': 1 });
betSchema.index({ isLive: 1 });

// Virtual for bet duration
betSchema.virtual('duration').get(function() {
  if (this.settledAt) {
    return this.settledAt - this.placedAt;
  }
  return Date.now() - this.placedAt;
});

// Virtual for profit/loss
betSchema.virtual('profitLoss').get(function() {
  if (this.status === 'won') {
    return this.payout.amount - this.stake;
  } else if (this.status === 'lost') {
    return -this.stake;
  }
  return 0;
});

// Virtual for ROI
betSchema.virtual('roi').get(function() {
  if (this.stake > 0) {
    return (this.profitLoss / this.stake) * 100;
  }
  return 0;
});

// Pre-save middleware to generate bet slip ID
betSchema.pre('save', function(next) {
  if (this.isNew && !this.betSlipId) {
    this.betSlipId = this.generateBetSlipId();
  }
  next();
});

// Method to generate unique bet slip ID
betSchema.methods.generateBetSlipId = function() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `BET${timestamp}${random}`.toUpperCase();
};

// Method to calculate potential win
betSchema.methods.calculatePotentialWin = function() {
  if (this.betType === 'single') {
    this.potentialWin = this.stake * this.totalOdds;
  } else if (this.betType === 'multiple') {
    this.potentialWin = this.stake * this.totalOdds;
  }
  return this.potentialWin;
};

// Method to validate bet
betSchema.methods.validateBet = function() {
  const errors = [];
  
  // Check minimum stake
  if (this.stake < parseFloat(process.env.MIN_BET_AMOUNT || 1)) {
    errors.push({
      field: 'stake',
      message: 'Bet amount below minimum',
      code: 'MIN_STAKE'
    });
  }

  // Check maximum stake
  if (this.stake > parseFloat(process.env.MAX_BET_AMOUNT || 10000)) {
    errors.push({
      field: 'stake',
      message: 'Bet amount above maximum',
      code: 'MAX_STAKE'
    });
  }

  // Check if user has sufficient balance
  // This would need to be implemented in the service layer

  this.validationErrors = errors;
  this.isValid = errors.length === 0;
  
  return this.isValid;
};

// Method to settle bet
betSchema.methods.settleBet = function(result, settledBy) {
  this.result = result;
  this.status = result === 'win' ? 'won' : 'lost';
  this.settledAt = new Date();
  this.settledBy = settledBy;

  if (result === 'win') {
    this.payout.amount = this.potentialWin;
  }

  return this.save();
};

// Method to process cash out
betSchema.methods.processCashOut = function(cashOutValue, processedBy) {
  if (!this.rules.allowCashOut) {
    throw new Error('Cash out not allowed for this bet');
  }

  this.cashOut.isProcessed = true;
  this.cashOut.currentValue = cashOutValue;
  this.cashOut.processedAt = new Date();
  this.cashOut.processedBy = processedBy;
  this.status = 'settled';
  this.result = 'void';

  return this.save();
};

// Static method to find active bets
betSchema.statics.findActiveBets = function() {
  return this.find({ status: 'active' });
};

// Static method to find bets by user
betSchema.statics.findByUser = function(userId, options = {}) {
  const query = { user: userId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.betType) {
    query.betType = options.betType;
  }

  return this.find(query)
    .sort({ placedAt: -1 })
    .populate('selections.sport selections.event selections.market selections.selection')
    .populate('user', 'username firstName lastName');
};

// Static method to calculate user statistics
betSchema.statics.calculateUserStats = function(userId) {
  return this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalBets: { $sum: 1 },
        totalStake: { $sum: '$stake' },
        totalWon: { $sum: { $cond: [{ $eq: ['$status', 'won'] }, '$payout.amount', 0] } },
        totalLost: { $sum: { $cond: [{ $eq: ['$status', 'lost'] }, '$stake', 0] } }
      }
    }
  ]);
};

module.exports = mongoose.model('Bet', betSchema); 