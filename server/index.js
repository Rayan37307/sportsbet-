const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const http = require("http");
const socketIo = require("socket.io");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const bettingRoutes = require("./routes/betting");
const adminRoutes = require("./routes/admin");
const agentRoutes = require("./routes/agents");
const eventsRoutes = require("./routes/events");
const sportsRoutes = require("./routes/sports");

// Import middleware
const { errorHandler } = require("./middleware/errorHandler");
const { authenticateToken } = require("./middleware/auth");

// Import services
const { initializeSocketHandlers } = require("./services/socketService");

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/sportsbook",
    );
    console.log("✅ Connected to MongoDB:", conn.connection.host);
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    console.log("📝 Using fallback local MongoDB connection...");
    try {
      const fallbackConn = await mongoose.connect(
        "mongodb://localhost:27017/sportsbook",
      );
      console.log(
        "✅ Connected to local MongoDB:",
        fallbackConn.connection.host,
      );
    } catch (fallbackErr) {
      console.error("❌ Local MongoDB connection also failed:", fallbackErr);
      console.log("⚠️  Server will continue without database connection");
    }
  }
};

connectDB();

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan("combined"));
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
);

// Rate limiting - more generous for development
const isDevelopment = process.env.NODE_ENV !== "production";

const limiter = rateLimit({
  windowMs:
    parseInt(process.env.RATE_LIMIT_WINDOW_MS) ||
    (isDevelopment ? 5 * 60 * 1000 : 15 * 60 * 1000), // 5 min dev, 15 min prod
  max:
    parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) ||
    (isDevelopment ? 1000 : 100), // 1000 dev, 100 prod
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiting to all API routes except auth in development
if (isDevelopment) {
  // More lenient auth rate limiting for development
  const authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 50, // 50 attempts per 5 minutes for auth
    message: "Too many authentication attempts, please try again later.",
  });
  app.use("/api/auth", authLimiter);

  // General API rate limiting
  app.use("/api/sports", limiter);
  app.use("/api/users", limiter);
  app.use("/api/betting", limiter);
  app.use("/api/admin", limiter);
  app.use("/api/agents", limiter);
} else {
  // Production: apply to all API routes
  app.use("/api/", limiter);
}

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl:
        process.env.MONGODB_URI || "mongodb://localhost:27017/sportsbook",
      collectionName: "sessions",
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);

// Static files
app.use("/uploads", express.static("uploads"));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", authenticateToken, userRoutes);
app.use("/api/betting", authenticateToken, bettingRoutes);
app.use("/api/admin", authenticateToken, adminRoutes);
app.use("/api/agents", authenticateToken, agentRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/sports", sportsRoutes);

// Socket.io connection handling
initializeSocketHandlers(io);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Sportsbook server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
    mongoose.connection.close();
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
    mongoose.connection.close();
  });
});

module.exports = { app, server, io };
