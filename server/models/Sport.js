const mongoose = require('mongoose');

const sportSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    trim: true
  },
  icon: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },

  // Sport Details
  category: {
    type: String,
    enum: ['team_sports', 'individual_sports', 'racing', 'esports', 'virtual_sports'],
    required: true
  },
  rules: {
    type: String,
    trim: true
  },
  scoringSystem: {
    type: String,
    trim: true
  },

  // Betting Configuration
  isActive: {
    type: Boolean,
    default: true
  },
  allowLiveBetting: {
    type: Boolean,
    default: true
  },
  allowPreMatchBetting: {
    type: Boolean,
    default: true
  },
  minBetAmount: {
    type: Number,
    default: 1.00
  },
  maxBetAmount: {
    type: Number,
    default: 10000.00
  },

  // Market Types Available
  availableMarkets: [{
    type: String,
    enum: [
      'match_winner',
      'over_under',
      'handicap',
      'both_teams_score',
      'correct_score',
      'first_scorer',
      'total_corners',
      'total_cards',
      'half_time_result',
      'double_chance',
      'draw_no_bet'
    ]
  }],

  // Live Betting Settings
  liveBetting: {
    enabled: {
      type: Boolean,
      default: true
    },
    updateInterval: {
      type: Number,
      default: 30 // seconds
    },
    maxDelay: {
      type: Number,
      default: 60 // seconds
    },
    allowCashOut: {
      type: Boolean,
      default: true
    }
  },

  // Odds Configuration
  oddsFormat: {
    type: String,
    enum: ['decimal', 'fractional', 'american'],
    default: 'decimal'
  },
  defaultMargin: {
    type: Number,
    default: 0.05, // 5% margin
    min: 0,
    max: 0.5
  },
  maxOdds: {
    type: Number,
    default: 1000.00
  },
  minOdds: {
    type: Number,
    default: 1.01
  },

  // Risk Management
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  maxExposure: {
    type: Number,
    default: 100000.00
  },
  suspensionRules: [{
    condition: String,
    action: {
      type: String,
      enum: ['suspend_betting', 'suspend_live_betting', 'reduce_limits', 'close_markets']
    },
    threshold: Number
  }],

  // Popularity and Statistics
  popularity: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  totalEvents: {
    type: Number,
    default: 0
  },
  totalBets: {
    type: Number,
    default: 0
  },
  totalTurnover: {
    type: Number,
    default: 0
  },

  // SEO and Display
  metaTitle: String,
  metaDescription: String,
  keywords: [String],
  displayOrder: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  },

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
sportSchema.index({ slug: 1 });
sportSchema.index({ isActive: 1 });
sportSchema.index({ category: 1 });
sportSchema.index({ popularity: -1 });
sportSchema.index({ displayOrder: 1 });

// Virtual for total markets count
sportSchema.virtual('totalMarkets').get(function() {
  return this.availableMarkets.length;
});

// Pre-save middleware to generate slug
sportSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.generateSlug();
  }
  next();
});

// Method to generate slug from name
sportSchema.methods.generateSlug = function() {
  return this.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// Method to update popularity score
sportSchema.methods.updatePopularity = function() {
  // Calculate popularity based on events, bets, and turnover
  const eventScore = Math.min(this.totalEvents / 100, 1) * 30;
  const betScore = Math.min(this.totalBets / 1000, 1) * 40;
  const turnoverScore = Math.min(this.totalTurnover / 100000, 1) * 30;
  
  this.popularity = Math.round(eventScore + betScore + turnoverScore);
  return this.save();
};

// Method to check if betting is allowed
sportSchema.methods.isBettingAllowed = function(betType = 'pre_match') {
  if (!this.isActive) return false;
  
  if (betType === 'live' && !this.allowLiveBetting) return false;
  if (betType === 'pre_match' && !this.allowPreMatchBetting) return false;
  
  return true;
};

// Method to validate bet amount
sportSchema.methods.validateBetAmount = function(amount) {
  return amount >= this.minBetAmount && amount <= this.maxBetAmount;
};

// Method to get available markets for this sport
sportSchema.methods.getAvailableMarkets = function() {
  return this.availableMarkets;
};

// Static method to find active sports
sportSchema.statics.findActive = function() {
  return this.find({ isActive: true }).sort({ displayOrder: 1, popularity: -1 });
};

// Static method to find sports by category
sportSchema.statics.findByCategory = function(category) {
  return this.find({ category, isActive: true }).sort({ popularity: -1 });
};

// Static method to find popular sports
sportSchema.statics.findPopular = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ popularity: -1 })
    .limit(limit);
};

// Static method to find featured sports
sportSchema.statics.findFeatured = function() {
  return this.find({ featured: true, isActive: true }).sort({ displayOrder: 1 });
};

// Static method to search sports
sportSchema.statics.search = function(query) {
  return this.find({
    $and: [
      { isActive: true },
      {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { keywords: { $in: [new RegExp(query, 'i')] } }
        ]
      }
    ]
  }).sort({ popularity: -1 });
};

module.exports = mongoose.model('Sport', sportSchema); 