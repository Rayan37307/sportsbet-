const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists and is active
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    if (user.isBlocked) {
      return res.status(401).json({
        success: false,
        message: 'Account is blocked'
      });
    }

    // Check if account is locked
    if (user.isLocked()) {
      return res.status(401).json({
        success: false,
        message: 'Account is temporarily locked due to multiple failed login attempts'
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// Middleware to check if user has specific role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Convert single role to array for easier handling
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Middleware to check if user is admin
const requireAdmin = requireRole(['admin', 'super_admin']);

// Middleware to check if user is agent or admin
const requireAgent = requireRole(['agent', 'sub_agent', 'admin', 'super_admin']);

// Middleware to check if user is player
const requirePlayer = requireRole(['player']);

// Middleware to check if user can access specific user data
const canAccessUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId || req.body.userId;
    
    if (!targetUserId) {
      return next();
    }

    // Admins can access all users
    if (['admin', 'super_admin'].includes(req.user.role)) {
      return next();
    }

    // Agents can access their players and sub-agents
    if (['agent', 'sub_agent'].includes(req.user.role)) {
      const targetUser = await User.findById(targetUserId);
      
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if target user is under this agent's hierarchy
      if (targetUser.parentAgent && targetUser.parentAgent.toString() === req.user._id.toString()) {
        return next();
      }

      // Check if target user is a sub-agent of this agent
      if (req.user.subAgents.includes(targetUserId)) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Access denied to this user'
      });
    }

    // Players can only access their own data
    if (req.user._id.toString() === targetUserId) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  } catch (error) {
    console.error('User access check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking user access'
    });
  }
};

// Middleware to check if user can manage specific event
const canManageEvent = async (req, res, next) => {
  try {
    const eventId = req.params.eventId || req.body.eventId;
    
    if (!eventId) {
      return next();
    }

    // Only admins can manage events
    if (['admin', 'super_admin'].includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Only administrators can manage events'
    });
  } catch (error) {
    console.error('Event management check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking event management permissions'
    });
  }
};

// Middleware to check if user can place bets
const canPlaceBets = async (req, res, next) => {
  try {
    // Check if user is verified
    if (!req.user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Account must be verified to place bets'
      });
    }

    // Check if user has sufficient balance (for bet placement)
    if (req.body.stake && req.user.wallet.balance < req.body.stake) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance to place this bet'
      });
    }

    next();
  } catch (error) {
    console.error('Bet placement check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking bet placement permissions'
    });
  }
};

// Middleware to check if user can access wallet
const canAccessWallet = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId || req.body.userId;
    
    if (!targetUserId) {
      return next();
    }

    // Users can only access their own wallet
    if (req.user._id.toString() === targetUserId) {
      return next();
    }

    // Admins can access all wallets
    if (['admin', 'super_admin'].includes(req.user.role)) {
      return next();
    }

    // Agents can access their players' wallets for monitoring
    if (['agent', 'sub_agent'].includes(req.user.role)) {
      const targetUser = await User.findById(targetUserId);
      
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if target user is under this agent's hierarchy
      if (targetUser.parentAgent && targetUser.parentAgent.toString() === req.user._id.toString()) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Access denied to this wallet'
      });
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  } catch (error) {
    console.error('Wallet access check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking wallet access'
    });
  }
};

// Middleware to refresh token
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Check if user exists
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '1h' }
    );

    req.user = user;
    req.newAccessToken = newAccessToken;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token expired'
      });
    }
    
    console.error('Token refresh error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error refreshing token'
    });
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireAgent,
  requirePlayer,
  canAccessUser,
  canManageEvent,
  canPlaceBets,
  canAccessWallet,
  refreshToken
}; 