const express = require("express");
const router = express.Router();
const { body, query, validationResult } = require("express-validator");

// Import the free odds service
const FreeOddsService = require("../services/freeOddsService");

// Initialize service
let oddsService;

const initializeOddsService = async () => {
  if (!oddsService) {
    oddsService = new FreeOddsService();

    try {
      await oddsService.initialize();

      // Set up event listeners for real-time updates
      oddsService.on("odds_update", (data) => {
        // Broadcast to connected clients via socket.io
        const io = require("../index").io;
        if (io) {
          io.emit("odds_update", data);
        }
      });

      oddsService.on("score_update", (data) => {
        const io = require("../index").io;
        if (io) {
          io.emit("score_update", data);
        }
      });

      oddsService.on("new_events", (data) => {
        const io = require("../index").io;
        if (io) {
          io.emit("new_events", data);
        }
      });

      oddsService.on("initial_data", (data) => {
        const io = require("../index").io;
        if (io) {
          io.emit("initial_data", data);
        }
      });
    } catch (error) {
      console.error("Failed to initialize odds service:", error);
    }
  }
  return oddsService;
};

// Middleware to ensure service is initialized
const ensureServiceInitialized = async (req, res, next) => {
  try {
    await initializeOddsService();
    next();
  } catch (error) {
    res.status(503).json({
      success: false,
      message: "Sports data service unavailable",
      error: error.message,
    });
  }
};

// GET /api/sports/health - Simple health check for testing
router.get("/health", async (req, res) => {
  try {
    res.json({
      success: true,
      message: "Sports API is healthy",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Health check failed",
      error: error.message,
    });
  }
});

// GET /api/sports - Get all available sports
router.get("/", ensureServiceInitialized, async (req, res) => {
  try {
    const sports = await oddsService.getSports();

    res.json({
      success: true,
      data: sports,
      meta: {
        count: sports.length,
        timestamp: new Date().toISOString(),
        source: oddsService.mockMode ? "mock" : "live_api",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch sports",
      error: error.message,
    });
  }
});

// GET /api/sports/events - Get live events for all sports or specific sport
router.get(
  "/events",
  [
    query("sport")
      .optional()
      .custom((value) => {
        if (value === null || value === undefined || value === "") {
          return true;
        }
        if (typeof value !== "string") {
          throw new Error("Sport must be a string");
        }
        return true;
      })
      .trim(),
    query("status")
      .optional()
      .isString()
      .isIn(["live", "upcoming", "finished", "all"]),
    query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  ensureServiceInitialized,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error("Events validation errors:", errors.array());
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array().map((err) => ({
            field: err.param || err.path,
            message: err.msg,
            value: err.value,
          })),
        });
      }

      // Sanitize query parameters
      let { sport, status, limit = 20 } = req.query;

      // Clean up sport parameter
      if (sport === null || sport === undefined || sport === "") {
        sport = undefined;
      }

      let events = await oddsService.getLiveEvents(sport);

      // Filter by status if specified
      if (status && status !== "all") {
        events = events.filter((event) => event.status === status);
      }

      // Apply limit
      events = events.slice(0, limit);

      res.json({
        success: true,
        data: events,
        meta: {
          count: events.length,
          filters: { sport, status, limit },
          timestamp: new Date().toISOString(),
          source: oddsService.mockMode ? "mock" : "live_api",
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch events",
        error: error.message,
      });
    }
  },
);

// GET /api/sports/live - Get only live events with real-time data
router.get("/live", ensureServiceInitialized, async (req, res) => {
  try {
    const events = await oddsService.getLiveEvents();
    const liveEvents = events.filter((event) => event.status === "live");

    res.json({
      success: true,
      data: liveEvents,
      meta: {
        count: liveEvents.length,
        timestamp: new Date().toISOString(),
        source: oddsService.mockMode ? "mock" : "live_api",
        updateFrequency: oddsService.mockMode ? "30s" : "15m",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch live events",
      error: error.message,
    });
  }
});

// GET /api/sports/scores - Get events with current scores
router.get("/scores", ensureServiceInitialized, async (req, res) => {
  try {
    const scores = await oddsService.getEventsWithScores();

    res.json({
      success: true,
      data: scores,
      meta: {
        count: scores.length,
        timestamp: new Date().toISOString(),
        source: oddsService.mockMode ? "mock" : "live_api",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch scores",
      error: error.message,
    });
  }
});

// GET /api/sports/upcoming - Get upcoming events with odds
router.get(
  "/upcoming",
  [
    query("hours").optional().isInt({ min: 1, max: 168 }).toInt(), // Max 1 week
    query("sport")
      .optional()
      .custom((value) => {
        if (value === null || value === undefined || value === "") {
          return true;
        }
        if (typeof value !== "string") {
          throw new Error("Sport must be a string");
        }
        return true;
      })
      .trim(),
  ],
  ensureServiceInitialized,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error("Upcoming validation errors:", errors.array());
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors.array().map((err) => ({
            field: err.param || err.path,
            message: err.msg,
            value: err.value,
          })),
        });
      }

      // Sanitize query parameters
      let { hours = 24, sport } = req.query;

      // Clean up sport parameter
      if (sport === null || sport === undefined || sport === "") {
        sport = undefined;
      }
      const cutoffTime = new Date(Date.now() + hours * 60 * 60 * 1000);

      let events = await oddsService.getLiveEvents(sport);

      // Filter for upcoming events within specified hours
      const upcomingEvents = events.filter((event) => {
        const eventTime = new Date(event.commence_time);
        return event.status === "upcoming" && eventTime <= cutoffTime;
      });

      res.json({
        success: true,
        data: upcomingEvents,
        meta: {
          count: upcomingEvents.length,
          hoursAhead: hours,
          sport: sport || "all",
          timestamp: new Date().toISOString(),
          source: oddsService.mockMode ? "mock" : "live_api",
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch upcoming events",
        error: error.message,
      });
    }
  },
);

// GET /api/sports/event/:eventId - Get specific event details
router.get(
  "/event/:eventId",
  [query("include_history").optional().isBoolean()],
  ensureServiceInitialized,
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const { include_history = false } = req.query;

      // Try to find event in active events first
      const event = oddsService.activeEvents.get(eventId);

      if (!event) {
        // If not found, fetch from API or return not found
        return res.status(404).json({
          success: false,
          message: "Event not found",
        });
      }

      const response = {
        success: true,
        data: event,
        meta: {
          timestamp: new Date().toISOString(),
          source: oddsService.mockMode ? "mock" : "live_api",
        },
      };

      // Add history if requested (this would need to be implemented)
      if (include_history) {
        response.data.history = {
          message: "Historical data not available in free tier",
          upgrade_info:
            "Consider upgrading to premium API for historical odds data",
        };
      }

      res.json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch event details",
        error: error.message,
      });
    }
  },
);

// GET /api/sports/bookmakers - Get supported bookmakers
router.get("/bookmakers", ensureServiceInitialized, async (req, res) => {
  try {
    const bookmakers = [
      {
        key: "draftkings",
        title: "DraftKings",
        region: "us",
        active: true,
      },
      {
        key: "fanduel",
        title: "FanDuel",
        region: "us",
        active: true,
      },
      {
        key: "betmgm",
        title: "BetMGM",
        region: "us",
        active: true,
      },
      {
        key: "caesars",
        title: "Caesars",
        region: "us",
        active: true,
      },
    ];

    res.json({
      success: true,
      data: bookmakers,
      meta: {
        count: bookmakers.length,
        region: "us",
        timestamp: new Date().toISOString(),
        note: "Free tier includes limited bookmakers. Premium APIs offer more options.",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch bookmakers",
      error: error.message,
    });
  }
});

// GET /api/sports/status - Get service status and API usage
router.get("/status", ensureServiceInitialized, async (req, res) => {
  try {
    const status = oddsService.getStatus();

    res.json({
      success: true,
      data: {
        service: status,
        api_info: {
          free_tier_limit: "500 requests/month",
          daily_limit: status.rateLimits?.oddsApi?.dailyLimit || "N/A",
          requests_used_today: status.rateLimits?.oddsApi?.dailyUsed || 0,
          total_remaining: status.rateLimits?.oddsApi?.remaining || "N/A",
          cache_enabled: true,
          real_time_updates: status.isRunning,
        },
        upgrade_options: {
          paid_tier: "https://the-odds-api.com/#get-access",
          benefits: [
            "Up to 5M requests/month",
            "Historical odds data",
            "More bookmakers",
            "Faster update frequency",
            "Player props & alternate markets",
          ],
        },
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch service status",
      error: error.message,
    });
  }
});

// POST /api/sports/refresh - Manually trigger data refresh (rate limited)
router.post(
  "/refresh",
  [
    body("sport")
      .optional()
      .custom((value) => {
        if (value === null || value === undefined || value === "") {
          return true; // Allow null, undefined, or empty string
        }
        if (typeof value !== "string") {
          throw new Error("Sport must be a string");
        }
        return true;
      })
      .trim(),
    body("force")
      .optional()
      .custom((value) => {
        if (value === null || value === undefined) {
          return true;
        }
        if (typeof value === "boolean") {
          return true;
        }
        if (value === "true" || value === "false") {
          return true;
        }
        throw new Error("Force must be a boolean");
      }),
  ],
  ensureServiceInitialized,
  async (req, res) => {
    try {
      // Debug logging for refresh requests
      console.log("📥 Refresh request received:", {
        body: req.body,
        headers: {
          "content-type": req.headers["content-type"],
        },
        params: req.params,
        query: req.query,
      });
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error("❌ Refresh validation errors:", {
          errors: errors.array(),
          body: req.body,
          contentType: req.headers["content-type"],
        });
        return res.status(400).json({
          success: false,
          message: "Validation error - Check request format",
          errors: errors.array().map((err) => ({
            field: err.param || err.path,
            message: `${err.msg} (received: ${JSON.stringify(err.value)})`,
            value: err.value,
            location: err.location,
          })),
          debug: {
            receivedBody: req.body,
            contentType: req.headers["content-type"],
          },
        });
      }

      console.log("✅ Refresh validation passed");

      // Sanitize the request body
      let { sport, force = false } = req.body;

      // Clean up sport parameter
      if (sport === null || sport === undefined || sport === "") {
        sport = undefined;
      }

      // Clean up force parameter
      if (typeof force === "string") {
        force = force.toLowerCase() === "true";
      } else if (typeof force !== "boolean") {
        force = false;
      }

      // Check if we can make more API calls today (bypass in development)
      const status = oddsService.getStatus();
      const isDevelopment = process.env.NODE_ENV !== "production";

      if (
        !force &&
        !isDevelopment &&
        status.rateLimits?.oddsApi?.dailyUsed >=
          status.rateLimits?.oddsApi?.dailyLimit
      ) {
        return res.status(429).json({
          success: false,
          message: "Daily API limit reached. Data will be served from cache.",
          next_reset: "Tomorrow at midnight",
          suggestion: "Use cached data or consider upgrading API plan",
        });
      }

      if (isDevelopment && !oddsService.mockMode) {
        console.log("🔧 Development mode: bypassing rate limits");
      }

      // Trigger manual refresh
      const events = await oddsService.getLiveEvents(sport);

      res.json({
        success: true,
        message: "Data refreshed successfully",
        data: {
          events_count: events.length,
          sport: sport || "all",
          timestamp: new Date().toISOString(),
        },
        meta: {
          api_calls_remaining_today: Math.max(
            0,
            (status.rateLimits?.oddsApi?.dailyLimit || 0) -
              (status.rateLimits?.oddsApi?.dailyUsed || 0),
          ),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to refresh data",
        error: error.message,
      });
    }
  },
);

// GET /api/sports/markets - Get available betting markets
router.get("/markets", ensureServiceInitialized, async (req, res) => {
  try {
    const markets = [
      {
        key: "h2h",
        name: "Moneyline",
        description: "Win/Loss betting on game outcome",
      },
      {
        key: "spreads",
        name: "Point Spread",
        description: "Betting on margin of victory",
      },
      {
        key: "totals",
        name: "Over/Under",
        description: "Betting on total points scored",
      },
    ];

    res.json({
      success: true,
      data: markets,
      meta: {
        count: markets.length,
        timestamp: new Date().toISOString(),
        note: "Free tier includes basic markets. Premium plans offer player props, alternates, and more.",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch markets",
      error: error.message,
    });
  }
});

module.exports = router;
