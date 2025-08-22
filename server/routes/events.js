const express = require("express");
const router = express.Router();

// Import the free odds service
const FreeOddsService = require("../services/freeOddsService");

// Initialize service (reuse the same instance from sports routes)
let oddsService;

const initializeOddsService = async () => {
  if (!oddsService) {
    oddsService = new FreeOddsService();
    try {
      await oddsService.initialize();
    } catch (error) {
      console.error(
        "Failed to initialize odds service in events routes:",
        error,
      );
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

// GET /api/events - Legacy endpoint mapped to /api/sports/events
router.get("/", ensureServiceInitialized, async (req, res) => {
  try {
    const { sport, status, limit = 20 } = req.query;

    // Handle "all" sport parameter
    const sportKey = sport === "all" ? null : sport;
    let events = await oddsService.getLiveEvents(sportKey);

    // Filter by status if specified
    if (status && status !== "all") {
      events = events.filter((event) => event.status === status);
    }

    // Apply limit
    events = events.slice(0, limit);

    // Transform to legacy format expected by old frontend
    const transformedEvents = events.map((event) => ({
      _id: event.id,
      team1: event.homeTeam,
      team2: event.awayTeam,
      league: event.sportName,
      sport: event.sport,
      startTime: event.commence_time,
      status: event.status,
      odds: {
        moneyline: {
          team1: event.odds?.moneyline?.homeTeam?.decimal || null,
          team2: event.odds?.moneyline?.awayTeam?.decimal || null,
        },
        spread: {
          team1Points: event.odds?.spread?.homeTeam?.point || null,
          team1Odds: event.odds?.spread?.homeTeam?.decimal || null,
          team2Points: event.odds?.spread?.awayTeam?.point || null,
          team2Odds: event.odds?.spread?.awayTeam?.decimal || null,
        },
        total: {
          points:
            event.odds?.total?.over?.point ||
            event.odds?.total?.under?.point ||
            null,
          overOdds: event.odds?.total?.over?.decimal || null,
          underOdds: event.odds?.total?.under?.decimal || null,
        },
      },
      lastUpdated: event.lastUpdated,
    }));

    res.json({
      success: true,
      data: {
        events: transformedEvents,
        count: transformedEvents.length,
      },
      meta: {
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
});

// GET /api/events/live - Legacy endpoint for live events only
router.get("/live", ensureServiceInitialized, async (req, res) => {
  try {
    const { sport } = req.query;

    // Handle "all" sport parameter
    const sportKey = sport === "all" ? null : sport;
    const events = await oddsService.getLiveEvents(sportKey);
    const liveEvents = events.filter((event) => event.status === "live");

    // Transform to legacy format
    const transformedEvents = liveEvents.map((event) => ({
      _id: event.id,
      team1: event.homeTeam,
      team2: event.awayTeam,
      league: event.sportName,
      sport: event.sport,
      startTime: event.commence_time,
      status: event.status,
      odds: {
        moneyline: {
          team1: event.odds?.moneyline?.homeTeam?.decimal || null,
          team2: event.odds?.moneyline?.awayTeam?.decimal || null,
        },
        spread: {
          team1Points: event.odds?.spread?.homeTeam?.point || null,
          team1Odds: event.odds?.spread?.homeTeam?.decimal || null,
          team2Points: event.odds?.spread?.awayTeam?.point || null,
          team2Odds: event.odds?.spread?.awayTeam?.decimal || null,
        },
        total: {
          points:
            event.odds?.total?.over?.point ||
            event.odds?.total?.under?.point ||
            null,
          overOdds: event.odds?.total?.over?.decimal || null,
          underOdds: event.odds?.total?.under?.decimal || null,
        },
      },
      lastUpdated: event.lastUpdated,
    }));

    res.json({
      success: true,
      data: {
        events: transformedEvents,
        count: transformedEvents.length,
      },
      meta: {
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

// GET /api/events/:eventId - Get specific event details (legacy format)
router.get("/:eventId", ensureServiceInitialized, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Try to find event in active events first
    const event = oddsService.activeEvents.get(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Transform to legacy format
    const transformedEvent = {
      _id: event.id,
      team1: event.homeTeam,
      team2: event.awayTeam,
      league: event.sportName,
      sport: event.sport,
      startTime: event.commence_time,
      status: event.status,
      odds: {
        moneyline: {
          team1: event.odds?.moneyline?.homeTeam?.decimal || null,
          team2: event.odds?.moneyline?.awayTeam?.decimal || null,
        },
        spread: {
          team1Points: event.odds?.spread?.homeTeam?.point || null,
          team1Odds: event.odds?.spread?.homeTeam?.decimal || null,
          team2Points: event.odds?.spread?.awayTeam?.point || null,
          team2Odds: event.odds?.spread?.awayTeam?.decimal || null,
        },
        total: {
          points:
            event.odds?.total?.over?.point ||
            event.odds?.total?.under?.point ||
            null,
          overOdds: event.odds?.total?.over?.decimal || null,
          underOdds: event.odds?.total?.under?.decimal || null,
        },
      },
      lastUpdated: event.lastUpdated,
    };

    res.json({
      success: true,
      data: transformedEvent,
      meta: {
        timestamp: new Date().toISOString(),
        source: oddsService.mockMode ? "mock" : "live_api",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch event details",
      error: error.message,
    });
  }
});

module.exports = router;
