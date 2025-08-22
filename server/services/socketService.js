const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Event = require('../models/Event');
const Bet = require('../models/Bet');
const { logger } = require('../middleware/errorHandler');

class SocketService {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // userId -> socketId
    this.userSockets = new Map(); // userId -> Set of socketIds
    this.roomUsers = new Map(); // roomName -> Set of userIds
    
    this.initialize();
  }

  initialize() {
    this.io.use(this.authenticateSocket.bind(this));
    this.io.on('connection', this.handleConnection.bind(this));
    
    // Set up periodic tasks
    this.setupPeriodicTasks();
    
    logger.info('Socket.io service initialized');
  }

  // Authenticate socket connections
  async authenticateSocket(socket, next) {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Remove 'Bearer ' prefix if present
      const cleanToken = token.replace('Bearer ', '');
      
      // Verify JWT token
      const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
      
      // Get user from database
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user || !user.isActive) {
        return next(new Error('Invalid or inactive user'));
      }

      // Attach user to socket
      socket.user = user;
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  }

  // Handle new socket connections
  handleConnection(socket) {
    const userId = socket.user._id.toString();
    const username = socket.user.username;

    logger.info(`User ${username} (${userId}) connected with socket ${socket.id}`);

    // Store socket connection
    this.addUserSocket(userId, socket.id);
    this.connectedUsers.set(socket.id, userId);

    // Join user to their personal room
    socket.join(`user:${userId}`);

    // Join user to role-based rooms
    socket.join(`role:${socket.user.role}`);
    
    // Join user to agent hierarchy rooms if applicable
    if (socket.user.parentAgent) {
      socket.join(`agent:${socket.user.parentAgent}`);
    }
    
    if (socket.user.role === 'agent' || socket.user.role === 'sub_agent') {
      socket.join(`agent:${userId}`);
    }

    // Handle user joining betting rooms
    this.handleBettingRooms(socket);

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });

    // Handle custom events
    this.handleCustomEvents(socket);

    // Send welcome message
    socket.emit('welcome', {
      message: `Welcome ${username}!`,
      userId: userId,
      role: socket.user.role,
      timestamp: new Date().toISOString()
    });

    // Notify other users in agent hierarchy about new connection
    if (socket.user.parentAgent || ['agent', 'sub_agent'].includes(socket.user.role)) {
      this.io.to(`agent:${socket.user.parentAgent || userId}`).emit('user_connected', {
        userId: userId,
        username: username,
        role: socket.user.role,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Handle socket disconnection
  handleDisconnection(socket) {
    const userId = socket.user._id.toString();
    const username = socket.user.username;

    logger.info(`User ${username} (${userId}) disconnected from socket ${socket.id}`);

    // Remove socket from tracking
    this.removeUserSocket(userId, socket.id);
    this.connectedUsers.delete(socket.id);

    // Notify other users in agent hierarchy about disconnection
    if (socket.user.parentAgent || ['agent', 'sub_agent'].includes(socket.user.role)) {
      this.io.to(`agent:${socket.user.parentAgent || userId}`).emit('user_disconnected', {
        userId: userId,
        username: username,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Handle betting room management
  handleBettingRooms(socket) {
    // Join live events room
    socket.on('join_live_events', () => {
      socket.join('live_events');
      logger.info(`User ${socket.user.username} joined live events room`);
    });

    // Leave live events room
    socket.on('leave_live_events', () => {
      socket.leave('live_events');
      logger.info(`User ${socket.user.username} left live events room`);
    });

    // Join specific event room
    socket.on('join_event', (eventId) => {
      socket.join(`event:${eventId}`);
      logger.info(`User ${socket.user.username} joined event room: ${eventId}`);
    });

    // Leave specific event room
    socket.on('leave_event', (eventId) => {
      socket.leave(`event:${eventId}`);
      logger.info(`User ${socket.user.username} left event room: ${eventId}`);
    });

    // Join sport room
    socket.on('join_sport', (sportId) => {
      socket.join(`sport:${sportId}`);
      logger.info(`User ${socket.user.username} joined sport room: ${sportId}`);
    });

    // Leave sport room
    socket.on('leave_sport', (sportId) => {
      socket.leave(`sport:${sportId}`);
      logger.info(`User ${socket.user.username} left sport room: ${sportId}`);
    });
  }

  // Handle custom events
  handleCustomEvents(socket) {
    // Handle chat messages
    socket.on('chat_message', (data) => {
      this.handleChatMessage(socket, data);
    });

    // Handle bet placement
    socket.on('bet_placed', (data) => {
      this.handleBetPlaced(socket, data);
    });

    // Handle live bet updates
    socket.on('live_bet_update', (data) => {
      this.handleLiveBetUpdate(socket, data);
    });

    // Handle user status updates
    socket.on('status_update', (data) => {
      this.handleStatusUpdate(socket, data);
    });
  }

  // Handle chat messages
  handleChatMessage(socket, data) {
    const { room, message, type = 'text' } = data;
    const userId = socket.user._id.toString();
    const username = socket.user.username;

    if (!room || !message) {
      socket.emit('error', { message: 'Room and message are required' });
      return;
    }

    const chatData = {
      userId: userId,
      username: username,
      message: message,
      type: type,
      timestamp: new Date().toISOString()
    };

    // Broadcast to room
    this.io.to(room).emit('chat_message', chatData);

    // Log chat message
    logger.info(`Chat message in ${room} from ${username}: ${message}`);
  }

  // Handle bet placement
  handleBetPlaced(socket, data) {
    const { betId, eventId, amount } = data;
    const userId = socket.user._id.toString();
    const username = socket.user.username;

    // Notify user's agent about the bet
    if (socket.user.parentAgent) {
      this.io.to(`user:${socket.user.parentAgent}`).emit('player_bet_placed', {
        playerId: userId,
        playerName: username,
        betId: betId,
        eventId: eventId,
        amount: amount,
        timestamp: new Date().toISOString()
      });
    }

    // Update event room with new bet
    if (eventId) {
      this.io.to(`event:${eventId}`).emit('bet_placed', {
        betId: betId,
        amount: amount,
        timestamp: new Date().toISOString()
      });
    }

    logger.info(`Bet placed by ${username}: ${betId} for event ${eventId}`);
  }

  // Handle live bet updates
  handleLiveBetUpdate(socket, data) {
    const { betId, status, odds } = data;
    
    // This would typically be triggered by admin/odds manager
    // For now, just log the update
    logger.info(`Live bet update: ${betId} - ${status} - ${odds}`);
  }

  // Handle user status updates
  handleStatusUpdate(socket, data) {
    const { status, message } = data;
    const userId = socket.user._id.toString();
    const username = socket.user.username;

    // Broadcast status update to agent hierarchy
    if (socket.user.parentAgent || ['agent', 'sub_agent'].includes(socket.user.role)) {
      this.io.to(`agent:${socket.user.parentAgent || userId}`).emit('user_status_update', {
        userId: userId,
        username: username,
        status: status,
        message: message,
        timestamp: new Date().toISOString()
      });
    }

    logger.info(`Status update from ${username}: ${status} - ${message}`);
  }

  // Utility methods for managing user connections
  addUserSocket(userId, socketId) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId).add(socketId);
  }

  removeUserSocket(userId, socketId) {
    if (this.userSockets.has(userId)) {
      this.userSockets.get(userId).delete(socketId);
      if (this.userSockets.get(userId).size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  // Get all socket IDs for a user
  getUserSockets(userId) {
    return this.userSockets.get(userId) || new Set();
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.userSockets.has(userId) && this.userSockets.get(userId).size > 0;
  }

  // Send message to specific user
  sendToUser(userId, event, data) {
    const userSockets = this.getUserSockets(userId);
    userSockets.forEach(socketId => {
      this.io.to(socketId).emit(event, data);
    });
  }

  // Send message to all users in a room
  sendToRoom(room, event, data) {
    this.io.to(room).emit(event, data);
  }

  // Send message to all connected users
  sendToAll(event, data) {
    this.io.emit(event, data);
  }

  // Send message to users with specific role
  sendToRole(role, event, data) {
    this.io.to(`role:${role}`).emit(event, data);
  }

  // Send message to agent hierarchy
  sendToAgentHierarchy(agentId, event, data) {
    this.io.to(`agent:${agentId}`).emit(event, data);
  }

  // Live odds update
  updateLiveOdds(eventId, marketId, newOdds) {
    const oddsData = {
      eventId: eventId,
      marketId: marketId,
      odds: newOdds,
      timestamp: new Date().toISOString()
    };

    // Send to event room
    this.sendToRoom(`event:${eventId}`, 'odds_updated', oddsData);
    
    // Send to live events room
    this.sendToRoom('live_events', 'odds_updated', oddsData);

    logger.info(`Live odds updated for event ${eventId}, market ${marketId}`);
  }

  // Live score update
  updateLiveScore(eventId, score, period, additionalStats) {
    const scoreData = {
      eventId: eventId,
      score: score,
      period: period,
      additionalStats: additionalStats,
      timestamp: new Date().toISOString()
    };

    // Send to event room
    this.sendToRoom(`event:${eventId}`, 'score_updated', scoreData);
    
    // Send to live events room
    this.sendToRoom('live_events', 'score_updated', scoreData);

    logger.info(`Live score updated for event ${eventId}: ${score.home}-${score.away}`);
  }

  // Bet result notification
  notifyBetResult(betId, userId, result, payout) {
    const resultData = {
      betId: betId,
      result: result,
      payout: payout,
      timestamp: new Date().toISOString()
    };

    // Send to user
    this.sendToUser(userId, 'bet_result', resultData);

    logger.info(`Bet result notified: ${betId} - ${result}`);
  }

  // Commission notification
  notifyCommission(userId, amount, betId) {
    const commissionData = {
      amount: amount,
      betId: betId,
      timestamp: new Date().toISOString()
    };

    // Send to user
    this.sendToUser(userId, 'commission_earned', commissionData);

    logger.info(`Commission notification sent to user ${userId}: ${amount}`);
  }

  // System notification
  sendSystemNotification(userIds, message, type = 'info') {
    const notificationData = {
      message: message,
      type: type,
      timestamp: new Date().toISOString()
    };

    userIds.forEach(userId => {
      this.sendToUser(userId, 'system_notification', notificationData);
    });

    logger.info(`System notification sent to ${userIds.length} users: ${message}`);
  }

  // Setup periodic tasks
  setupPeriodicTasks() {
    // Update online user count every 30 seconds
    setInterval(() => {
      const onlineCount = this.connectedUsers.size;
      this.io.emit('online_users_count', { count: onlineCount });
    }, 30000);

    // Clean up disconnected users every 5 minutes
    setInterval(() => {
      this.cleanupDisconnectedUsers();
    }, 300000);
  }

  // Clean up disconnected users
  cleanupDisconnectedUsers() {
    const currentTime = Date.now();
    let cleanedCount = 0;

    for (const [socketId, userId] of this.connectedUsers.entries()) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (!socket || !socket.connected) {
        this.connectedUsers.delete(socketId);
        this.removeUserSocket(userId, socketId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info(`Cleaned up ${cleanedCount} disconnected users`);
    }
  }

  // Get connection statistics
  getConnectionStats() {
    return {
      totalConnections: this.connectedUsers.size,
      uniqueUsers: this.userSockets.size,
      rooms: Array.from(this.io.sockets.adapter.rooms.keys()),
      timestamp: new Date().toISOString()
    };
  }
}

// Initialize socket handlers
const initializeSocketHandlers = (io) => {
  return new SocketService(io);
};

module.exports = {
  initializeSocketHandlers,
  SocketService
}; 