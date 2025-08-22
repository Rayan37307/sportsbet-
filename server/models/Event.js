const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  sport: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sport',
    required: true
  },

  // Teams and Participants
  homeTeam: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    shortName: String,
    logo: String,
    country: String,
    league: String
  },
  awayTeam: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    shortName: String,
    logo: String,
    country: String,
    league: String
  },

  // Event Details
  eventType: {
    type: String,
    enum: ['match', 'tournament', 'race', 'game', 'competition'],
    default: 'match'
  },
  competition: {
    name: String,
    season: String,
    round: String,
    stage: String
  },
  venue: {
    name: String,
    city: String,
    country: String,
    capacity: Number
  },

  // Schedule and Timing
  startTime: {
    type: Date,
    required: true
  },
  endTime: Date,
  timezone: {
    type: String,
    default: 'UTC'
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'finished', 'cancelled', 'postponed', 'suspended'],
    default: 'scheduled'
  },

  // Live Event Information
  liveData: {
    currentTime: String, // e.g., "45:30" for football
    period: String, // e.g., "1st Half", "2nd Half", "Extra Time"
    score: {
      home: { type: Number, default: 0 },
      away: { type: Number, default: 0 }
    },
    halfTimeScore: {
      home: { type: Number, default: 0 },
      away: { type: Number, default: 0 }
    },
    additionalStats: {
      corners: { home: Number, away: Number },
      yellowCards: { home: Number, away: Number },
      redCards: { home: Number, away: Number },
      shots: { home: Number, away: Number },
      shotsOnTarget: { home: Number, away: Number },
      possession: { home: Number, away: Number }
    },
    lastUpdate: Date
  },

  // Betting Configuration
  bettingStatus: {
    type: String,
    enum: ['open', 'suspended', 'closed', 'settled'],
    default: 'open'
  },
  allowLiveBetting: {
    type: Boolean,
    default: true
  },
  allowPreMatchBetting: {
    type: Boolean,
    default: true
  },
  bettingDeadline: Date,
  liveBettingDeadline: Date,

  // Markets and Odds
  markets: [{
    market: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Market',
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastUpdate: Date
  }],

  // Risk Management
  maxExposure: {
    type: Number,
    default: 100000.00
  },
  currentExposure: {
    type: Number,
    default: 0
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },

  // Statistics and Analytics
  totalBets: {
    type: Number,
    default: 0
  },
  totalTurnover: {
    type: Number,
    default: 0
  },
  averageOdds: {
    type: Number,
    default: 0
  },
  bettingTrends: [{
    timestamp: Date,
    totalBets: Number,
    totalTurnover: Number,
    averageOdds: Number
  }],

  // Results and Settlement
  result: {
    winner: {
      type: String,
      enum: ['home', 'away', 'draw', 'pending']
    },
    finalScore: {
      home: Number,
      away: Number
    },
    halfTimeResult: {
      winner: {
        type: String,
        enum: ['home', 'away', 'draw', 'pending']
      },
      score: {
        home: Number,
        away: Number
      }
    },
    extraTime: {
      home: Number,
      away: Number
    },
    penalties: {
      home: Number,
      away: Number
    }
  },
  settledAt: Date,
  settledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // SEO and Display
  metaTitle: String,
  metaDescription: String,
  featured: {
    type: Boolean,
    default: false
  },
  displayOrder: {
    type: Number,
    default: 0
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
eventSchema.index({ slug: 1 });
eventSchema.index({ sport: 1 });
eventSchema.index({ startTime: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ 'homeTeam.name': 1 });
eventSchema.index({ 'awayTeam.name': 1 });
eventSchema.index({ bettingStatus: 1 });
eventSchema.index({ featured: 1 });

// Virtual for event duration
eventSchema.virtual('duration').get(function() {
  if (this.startTime && this.endTime) {
    return this.endTime - this.startTime;
  }
  return null;
});

// Virtual for is live
eventSchema.virtual('isLive').get(function() {
  return this.status === 'live';
});

// Virtual for is finished
eventSchema.virtual('isFinished').get(function() {
  return this.status === 'finished';
});

// Virtual for can bet
eventSchema.virtual('canBet').get(function() {
  return this.bettingStatus === 'open' && 
         this.status !== 'finished' && 
         this.status !== 'cancelled';
});

// Pre-save middleware to generate slug
eventSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.generateSlug();
  }
  next();
});

// Method to generate slug from name
eventSchema.methods.generateSlug = function() {
  const baseSlug = `${this.homeTeam.name}-vs-${this.awayTeam.name}`;
  const timestamp = this.startTime ? this.startTime.getTime() : Date.now();
  return `${baseSlug}-${timestamp}`.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// Method to start live event
eventSchema.methods.startLiveEvent = function() {
  this.status = 'live';
  this.liveData.lastUpdate = new Date();
  this.bettingStatus = this.allowLiveBetting ? 'open' : 'suspended';
  return this.save();
};

// Method to finish event
eventSchema.methods.finishEvent = function(finalScore, winner) {
  this.status = 'finished';
  this.result.finalScore = finalScore;
  this.result.winner = winner;
  this.bettingStatus = 'closed';
  this.liveData.lastUpdate = new Date();
  return this.save();
};

// Method to update live score
eventSchema.methods.updateLiveScore = function(score, period, additionalStats = {}) {
  this.liveData.score = score;
  this.liveData.period = period;
  this.liveData.additionalStats = { ...this.liveData.additionalStats, ...additionalStats };
  this.liveData.lastUpdate = new Date();
  return this.save();
};

// Method to suspend betting
eventSchema.methods.suspendBetting = function(reason = '') {
  this.bettingStatus = 'suspended';
  return this.save();
};

// Method to resume betting
eventSchema.methods.resumeBetting = function() {
  if (this.status === 'live' && this.allowLiveBetting) {
    this.bettingStatus = 'open';
  } else if (this.status === 'scheduled' && this.allowPreMatchBetting) {
    this.bettingStatus = 'open';
  }
  return this.save();
};

// Method to calculate current exposure
eventSchema.methods.calculateExposure = async function() {
  // This would need to be implemented with actual bet aggregation
  // For now, return the stored value
  return this.currentExposure;
};

// Method to check if betting should be suspended
eventSchema.methods.shouldSuspendBetting = function() {
  if (this.currentExposure >= this.maxExposure) {
    return true;
  }
  
  // Add other suspension logic here
  return false;
};

// Static method to find upcoming events
eventSchema.statics.findUpcoming = function(limit = 20) {
  return this.find({
    startTime: { $gt: new Date() },
    status: 'scheduled',
    bettingStatus: 'open'
  })
  .sort({ startTime: 1 })
  .limit(limit)
  .populate('sport', 'name icon');
};

// Static method to find live events
eventSchema.statics.findLive = function() {
  return this.find({
    status: 'live',
    bettingStatus: 'open'
  })
  .sort({ startTime: 1 })
  .populate('sport', 'name icon');
};

// Static method to find events by sport
eventSchema.statics.findBySport = function(sportId, options = {}) {
  const query = { sport: sportId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.bettingStatus) {
    query.bettingStatus = options.bettingStatus;
  }

  return this.find(query)
    .sort({ startTime: 1 })
    .populate('sport', 'name icon');
};

// Static method to find events by team
eventSchema.statics.findByTeam = function(teamName) {
  return this.find({
    $or: [
      { 'homeTeam.name': { $regex: teamName, $options: 'i' } },
      { 'awayTeam.name': { $regex: teamName, $options: 'i' } }
    ]
  })
  .sort({ startTime: -1 })
  .populate('sport', 'name icon');
};

// Static method to search events
eventSchema.statics.search = function(query) {
  return this.find({
    $and: [
      { status: { $ne: 'cancelled' } },
      {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { 'homeTeam.name': { $regex: query, $options: 'i' } },
          { 'awayTeam.name': { $regex: query, $options: 'i' } },
          { 'competition.name': { $regex: query, $options: 'i' } }
        ]
      }
    ]
  })
  .sort({ startTime: 1 })
  .populate('sport', 'name icon');
};

module.exports = mongoose.model('Event', eventSchema); 