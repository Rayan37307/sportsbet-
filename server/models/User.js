const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  phone: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  profilePicture: {
    type: String,
    default: ''
  },

  // Role and Hierarchy
  role: {
    type: String,
    enum: ['player', 'sub_agent', 'agent', 'admin', 'super_admin'],
    default: 'player'
  },
  parentAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  subAgents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  players: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Wallet and Financial
  wallet: {
    balance: {
      type: Number,
      default: 0,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    transactions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction'
    }]
  },

  // Commission and Earnings
  commissionRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  monthlyEarnings: {
    type: Number,
    default: 0
  },
  pendingCommissions: {
    type: Number,
    default: 0
  },

  // Betting Statistics
  bettingStats: {
    totalBets: {
      type: Number,
      default: 0
    },
    totalWagered: {
      type: Number,
      default: 0
    },
    totalWon: {
      type: Number,
      default: 0
    },
    totalLost: {
      type: Number,
      default: 0
    },
    winRate: {
      type: Number,
      default: 0
    }
  },

  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  },

  // KYC and Verification
  kycStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  kycDocuments: [{
    type: {
      type: String,
      enum: ['id_card', 'passport', 'drivers_license', 'utility_bill']
    },
    documentNumber: String,
    documentImage: String,
    verifiedAt: Date
  }],

  // Preferences
  preferences: {
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    }
  },

  // Security
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: String,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,

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
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ parentAgent: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for account age
userSchema.virtual('accountAge').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if account is locked
userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Method to calculate commission
userSchema.methods.calculateCommission = function(amount) {
  return amount * this.commissionRate;
};

// Method to update betting statistics
userSchema.methods.updateBettingStats = function(betAmount, isWin, winAmount = 0) {
  const update = {
    $inc: {
      'bettingStats.totalBets': 1,
      'bettingStats.totalWagered': betAmount
    }
  };

  if (isWin) {
    update.$inc['bettingStats.totalWon'] = winAmount;
  } else {
    update.$inc['bettingStats.totalLost'] = betAmount;
  }

  return this.updateOne(update);
};

// Static method to find users by role
userSchema.statics.findByRole = function(role) {
  return this.find({ role, isActive: true });
};

// Static method to find agents with players
userSchema.statics.findAgentsWithPlayers = function() {
  return this.aggregate([
    { $match: { role: { $in: ['agent', 'sub_agent'] } } },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: 'parentAgent',
        as: 'players'
      }
    },
    {
      $addFields: {
        playerCount: { $size: '$players' }
      }
    }
  ]);
};

module.exports = mongoose.model('User', userSchema); 