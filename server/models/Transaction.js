const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  // Transaction Information
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'bet_placed', 'bet_won', 'bet_lost', 'commission', 'refund', 'bonus', 'fee'],
    required: true
  },
  category: {
    type: String,
    enum: ['wallet', 'betting', 'commission', 'bonus', 'fee'],
    required: true
  },

  // Financial Details
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  balanceBefore: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },

  // Payment Method
  paymentMethod: {
    type: String,
    enum: ['crypto', 'bank_transfer', 'credit_card', 'ewallet', 'internal', 'bonus'],
    required: true
  },
  paymentDetails: {
    // For crypto payments
    cryptoNetwork: String,
    cryptoAddress: String,
    transactionHash: String,
    
    // For bank transfers
    bankName: String,
    accountNumber: String,
    routingNumber: String,
    
    // For e-wallets
    ewalletProvider: String,
    ewalletId: String,
    
    // For credit cards
    cardLast4: String,
    cardBrand: String
  },

  // Status and Processing
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'reversed'],
    default: 'pending'
  },
  processedAt: Date,
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Related Entities
  relatedBet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bet'
  },
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Fees and Charges
  fees: {
    amount: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    },
    description: String
  },

  // Commission Details
  commission: {
    amount: {
      type: Number,
      default: 0
    },
    rate: {
      type: Number,
      default: 0
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },

  // Verification and Security
  verificationCode: String,
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationExpiresAt: Date,
  ipAddress: String,
  userAgent: String,

  // Notes and Metadata
  description: String,
  internalNotes: String,
  externalReference: String,
  tags: [String],

  // Risk and Compliance
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  complianceFlags: [{
    type: String,
    severity: String,
    description: String,
    resolvedAt: Date
  }],

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
transactionSchema.index({ user: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ transactionId: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ 'paymentDetails.transactionHash': 1 });

// Virtual for net amount (amount - fees)
transactionSchema.virtual('netAmount').get(function() {
  return this.amount - this.fees.amount;
});

// Virtual for transaction duration
transactionSchema.virtual('duration').get(function() {
  if (this.processedAt) {
    return this.processedAt - this.createdAt;
  }
  return Date.now() - this.createdAt;
});

// Pre-save middleware to generate transaction ID
transactionSchema.pre('save', function(next) {
  if (this.isNew && !this.transactionId) {
    this.transactionId = this.generateTransactionId();
  }
  next();
});

// Method to generate unique transaction ID
transactionSchema.methods.generateTransactionId = function() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  const type = this.type.substring(0, 3).toUpperCase();
  return `TXN${type}${timestamp}${random}`.toUpperCase();
};

// Method to process transaction
transactionSchema.methods.processTransaction = function(processedBy) {
  this.status = 'completed';
  this.processedAt = new Date();
  this.processedBy = processedBy;
  return this.save();
};

// Method to fail transaction
transactionSchema.methods.failTransaction = function(reason) {
  this.status = 'failed';
  this.description = reason;
  return this.save();
};

// Method to reverse transaction
transactionSchema.methods.reverseTransaction = function(reason, reversedBy) {
  this.status = 'reversed';
  this.description = reason;
  this.processedBy = reversedBy;
  this.processedAt = new Date();
  return this.save();
};

// Method to calculate fees
transactionSchema.methods.calculateFees = function() {
  let feeAmount = 0;
  
  if (this.fees.percentage > 0) {
    feeAmount = this.amount * (this.fees.percentage / 100);
  }
  
  if (this.fees.amount > 0) {
    feeAmount += this.fees.amount;
  }
  
  this.fees.amount = feeAmount;
  return feeAmount;
};

// Static method to find transactions by user
transactionSchema.statics.findByUser = function(userId, options = {}) {
  const query = { user: userId };
  
  if (options.type) {
    query.type = options.type;
  }
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.category) {
    query.category = options.category;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .populate('relatedBet', 'betSlipId stake totalOdds')
    .populate('relatedUser', 'username firstName lastName');
};

// Static method to calculate user balance
transactionSchema.statics.calculateUserBalance = function(userId) {
  return this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId), status: 'completed' } },
    {
      $group: {
        _id: null,
        totalDeposits: { $sum: { $cond: [{ $eq: ['$type', 'deposit'] }, '$amount', 0] } },
        totalWithdrawals: { $sum: { $cond: [{ $eq: ['$type', 'withdrawal'] }, '$amount', 0] } },
        totalWinnings: { $sum: { $cond: [{ $eq: ['$type', 'bet_won'] }, '$amount', 0] } },
        totalLosses: { $sum: { $cond: [{ $eq: ['$type', 'bet_lost'] }, '$amount', 0] } },
        totalCommissions: { $sum: { $cond: [{ $eq: ['$type', 'commission'] }, '$amount', 0] } },
        totalFees: { $sum: '$fees.amount' }
      }
    }
  ]);
};

// Static method to find pending transactions
transactionSchema.statics.findPendingTransactions = function() {
  return this.find({ status: 'pending' })
    .populate('user', 'username email firstName lastName')
    .sort({ createdAt: 1 });
};

// Static method to find transactions by date range
transactionSchema.statics.findByDateRange = function(startDate, endDate, options = {}) {
  const query = {
    createdAt: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };
  
  if (options.type) {
    query.type = options.type;
  }
  
  if (options.status) {
    query.status = options.status;
  }

  return this.find(query)
    .populate('user', 'username firstName lastName')
    .sort({ createdAt: -1 });
};

// Static method to generate financial reports
transactionSchema.statics.generateFinancialReport = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: {
          type: '$type',
          category: '$category'
        },
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalFees: { $sum: '$fees.amount' },
        averageAmount: { $avg: '$amount' }
      }
    },
    {
      $sort: { '_id.category': 1, '_id.type': 1 }
    }
  ]);
};

module.exports = mongoose.model('Transaction', transactionSchema); 