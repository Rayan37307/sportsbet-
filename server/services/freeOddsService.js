const axios = require("axios");
const EventEmitter = require("events");

class FreeOddsService extends EventEmitter {
  constructor() {
    super();
    // The Odds API - Free tier: 500 requests/month
    this.oddsApiKey = process.env.ODDS_API_KEY;
    this.baseUrl = "https://api.the-odds-api.com/v4";

    // Free alternative APIs as fallbacks
    this.fallbackApis = {
      // Sport Monk (free tier available)
      sportMonk: process.env.SPORTMONK_API_KEY,
      // API Football (free tier available)
      apiFootball: process.env.API_FOOTBALL_KEY,
    };

    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes cache
    this.updateIntervals = new Map();
    this.activeEvents = new Map();
    this.isRunning = false;

    // Rate limiting for free tier
    this.rateLimits = {
      oddsApi: {
        remaining: 500,
        used: 0,
        resetTime: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
        dailyLimit: process.env.NODE_ENV === "production" ? 17 : 100, // More generous in dev
        dailyUsed: 0,
        lastResetDate: new Date().toDateString(),
      },
    };

    // Supported sports in free tier
    this.supportedSports = [
      { key: "americanfootball_nfl", name: "NFL", priority: 1 },
      { key: "basketball_nba", name: "NBA", priority: 1 },
      { key: "baseball_mlb", name: "MLB", priority: 1 },
      { key: "icehockey_nhl", name: "NHL", priority: 1 },
      { key: "soccer_epl", name: "Premier League", priority: 2 },
      {
        key: "soccer_uefa_champs_league",
        name: "Champions League",
        priority: 2,
      },
      { key: "americanfootball_ncaaf", name: "College Football", priority: 2 },
      { key: "basketball_ncaab", name: "College Basketball", priority: 2 },
    ];

    this.prioritySports = this.supportedSports
      .filter((s) => s.priority === 1)
      .map((s) => s.key);
  }

  // Initialize the service
  async initialize() {
    console.log("🏈 Initializing Free Odds Service...");

    if (!this.oddsApiKey) {
      console.log("⚠️ No Odds API key found. Using mock data mode.");
      console.log("📝 Get your free API key at: https://the-odds-api.com");
      this.mockMode = true;
    }

    try {
      if (!this.mockMode) {
        await this.testConnection();
        this.startSmartUpdates();
      } else {
        this.startMockUpdates();
      }

      this.isRunning = true;
      console.log("✅ Free Odds Service initialized successfully");

      // Emit initial data
      setTimeout(() => this.emitInitialData(), 1000);
    } catch (error) {
      console.error("❌ Failed to initialize Free Odds Service:", error);
      console.log("🔄 Falling back to mock data mode...");
      this.mockMode = true;
      this.startMockUpdates();
      this.isRunning = true;
    }
  }

  // Test API connection
  async testConnection() {
    try {
      const response = await this.makeApiCall("/sports", {
        apiKey: this.oddsApiKey,
      });

      console.log("✅ The Odds API connection successful");
      console.log(
        `📊 Rate limit: ${this.rateLimits.oddsApi.remaining} requests remaining`,
      );

      return response.data;
    } catch (error) {
      console.error("❌ The Odds API test failed:", error.message);
      throw error;
    }
  }

  // Smart API call with rate limiting and caching
  async makeApiCall(endpoint, params = {}) {
    const cacheKey = `${endpoint}_${JSON.stringify(params)}`;

    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log("📱 Using cached data for:", endpoint);
        return cached.data;
      }
    }

    // Check daily rate limit
    this.checkDailyRateLimit();

    try {
      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        params,
        timeout: 10000,
      });

      // Update rate limiting info
      this.updateRateLimit(response.headers);

      // Cache the response
      this.cache.set(cacheKey, {
        data: response,
        timestamp: Date.now(),
      });

      return response;
    } catch (error) {
      console.error(`❌ API call failed for ${endpoint}:`, error.message);

      // Return cached data if available, even if expired
      if (this.cache.has(cacheKey)) {
        console.log("📦 Using expired cache data as fallback");
        return this.cache.get(cacheKey).data;
      }

      // If no cached data available, don't throw error - fall back to mock data
      console.log("🎭 Falling back to mock data mode");
      this.mockMode = true;
      return null;
    }
  }

  // Check and reset daily rate limit
  checkDailyRateLimit() {
    // Skip rate limiting in mock mode
    if (this.mockMode) {
      return;
    }

    const today = new Date().toDateString();

    if (this.rateLimits.oddsApi.lastResetDate !== today) {
      this.rateLimits.oddsApi.dailyUsed = 0;
      this.rateLimits.oddsApi.lastResetDate = today;
      console.log("🔄 Daily rate limit reset");
    }

    if (
      this.rateLimits.oddsApi.dailyUsed >= this.rateLimits.oddsApi.dailyLimit
    ) {
      console.log("⚠️ Daily API limit reached, switching to cached data only");
      // Don't throw error, just log warning - cached data will be used
      return;
    }
  }

  // Update rate limit tracking
  updateRateLimit(headers) {
    if (headers["x-requests-remaining"]) {
      this.rateLimits.oddsApi.remaining = parseInt(
        headers["x-requests-remaining"],
      );
    }

    if (headers["x-requests-used"]) {
      this.rateLimits.oddsApi.used = parseInt(headers["x-requests-used"]);
    }

    this.rateLimits.oddsApi.dailyUsed++;

    console.log(
      `📊 API Usage: ${this.rateLimits.oddsApi.dailyUsed}/${this.rateLimits.oddsApi.dailyLimit} today, ${this.rateLimits.oddsApi.remaining} total remaining`,
    );
  }

  // Get available sports
  async getSports() {
    if (this.mockMode) {
      return this.supportedSports.map((sport) => ({
        id: sport.key,
        name: sport.name,
        active: true,
        priority: sport.priority,
      }));
    }

    try {
      const response = await this.makeApiCall("/sports", {
        apiKey: this.oddsApiKey,
      });

      const apiSports = response.data;

      // Filter to only supported sports to save API calls
      return this.supportedSports
        .filter((sport) =>
          apiSports.some((apiSport) => apiSport.key === sport.key),
        )
        .map((sport) => {
          const apiSport = apiSports.find((s) => s.key === sport.key);
          return {
            id: sport.key,
            name: sport.name,
            active: apiSport ? apiSport.active : false,
            priority: sport.priority,
            hasOutrights: apiSport ? apiSport.has_outrights : false,
          };
        });
    } catch (error) {
      console.error("Error fetching sports:", error.message);
      return this.supportedSports.map((sport) => ({
        id: sport.key,
        name: sport.name,
        active: true,
        priority: sport.priority,
      }));
    }
  }

  // Get live events for priority sports only
  async getLiveEvents(sportKey = null) {
    if (this.mockMode) {
      return this.getMockLiveEvents(sportKey);
    }

    try {
      const sportsToFetch = sportKey ? [sportKey] : this.prioritySports;
      const allEvents = [];

      // Fetch events for each sport (prioritize to save API calls)
      for (const sport of sportsToFetch.slice(0, 2)) {
        // Limit to 2 sports to save API calls
        try {
          const response = await this.makeApiCall(`/sports/${sport}/odds`, {
            apiKey: this.oddsApiKey,
            regions: "us",
            markets: "h2h,spreads,totals",
            oddsFormat: "american",
            bookmakers: "draftkings,fanduel", // Limit bookmakers to save on data
            dateFormat: "iso",
          });

          const events = this.transformEventsData(response.data, sport);
          allEvents.push(...events);
        } catch (error) {
          console.error(`Error fetching events for ${sport}:`, error.message);
          continue;
        }
      }

      return allEvents;
    } catch (error) {
      console.error("Error fetching live events:", error.message);
      return this.getMockLiveEvents(sportKey);
    }
  }

  // Get events with scores (using different endpoint to save calls)
  async getEventsWithScores() {
    if (this.mockMode) {
      return this.getMockEventsWithScores();
    }

    try {
      // Use upcoming endpoint for efficiency
      const response = await this.makeApiCall("/sports/upcoming/scores", {
        apiKey: this.oddsApiKey,
        daysFrom: 0,
        daysTo: 1,
      });

      return response.data
        .filter((event) => this.prioritySports.includes(event.sport_key))
        .map((event) => ({
          id: event.id,
          sport: event.sport_key,
          sportName: this.getSportName(event.sport_key),
          homeTeam: event.home_team,
          awayTeam: event.away_team,
          commence_time: event.commence_time,
          completed: event.completed,
          scores: event.scores || null,
          lastUpdate: event.last_update,
        }));
    } catch (error) {
      console.error("Error fetching events with scores:", error.message);
      return this.getMockEventsWithScores();
    }
  }

  // Transform API data to our format
  transformEventsData(data, sportKey) {
    return data.map((event) => {
      const odds = this.extractBestOdds(event.bookmakers);

      return {
        id: event.id,
        sport: sportKey,
        sportName: this.getSportName(sportKey),
        homeTeam: event.home_team,
        awayTeam: event.away_team,
        commence_time: event.commence_time,
        status: this.getEventStatus(event.commence_time),
        odds: odds,
        bookmakers: event.bookmakers
          ? event.bookmakers.map((b) => ({
              key: b.key,
              title: b.title,
              lastUpdate: b.last_update,
            }))
          : [],
        lastUpdated: new Date().toISOString(),
      };
    });
  }

  // Extract best odds from multiple bookmakers
  extractBestOdds(bookmakers) {
    if (!bookmakers || bookmakers.length === 0) return null;

    const odds = {
      moneyline: { homeTeam: null, awayTeam: null },
      spread: { homeTeam: null, awayTeam: null },
      total: { over: null, under: null },
    };

    bookmakers.forEach((bookmaker) => {
      bookmaker.markets.forEach((market) => {
        switch (market.key) {
          case "h2h":
            const homeML = market.outcomes.find(
              (o) => o.name === bookmaker.home_team,
            );
            const awayML = market.outcomes.find(
              (o) => o.name === bookmaker.away_team,
            );

            if (
              homeML &&
              (!odds.moneyline.homeTeam ||
                homeML.price > odds.moneyline.homeTeam.price)
            ) {
              odds.moneyline.homeTeam = {
                price: homeML.price,
                decimal: this.americanToDecimal(homeML.price),
                bookmaker: bookmaker.key,
              };
            }

            if (
              awayML &&
              (!odds.moneyline.awayTeam ||
                awayML.price > odds.moneyline.awayTeam.price)
            ) {
              odds.moneyline.awayTeam = {
                price: awayML.price,
                decimal: this.americanToDecimal(awayML.price),
                bookmaker: bookmaker.key,
              };
            }
            break;

          case "spreads":
            market.outcomes.forEach((outcome) => {
              const isHome = outcome.name === bookmaker.home_team;
              const key = isHome ? "homeTeam" : "awayTeam";

              if (!odds.spread[key] || outcome.price > odds.spread[key].price) {
                odds.spread[key] = {
                  point: outcome.point,
                  price: outcome.price,
                  decimal: this.americanToDecimal(outcome.price),
                  bookmaker: bookmaker.key,
                };
              }
            });
            break;

          case "totals":
            const over = market.outcomes.find((o) => o.name === "Over");
            const under = market.outcomes.find((o) => o.name === "Under");

            if (
              over &&
              (!odds.total.over || over.price > odds.total.over.price)
            ) {
              odds.total.over = {
                point: over.point,
                price: over.price,
                decimal: this.americanToDecimal(over.price),
                bookmaker: bookmaker.key,
              };
            }

            if (
              under &&
              (!odds.total.under || under.price > odds.total.under.price)
            ) {
              odds.total.under = {
                point: under.point,
                price: under.price,
                decimal: this.americanToDecimal(under.price),
                bookmaker: bookmaker.key,
              };
            }
            break;
        }
      });
    });

    return odds;
  }

  // Convert American odds to decimal
  americanToDecimal(american) {
    if (!american) return null;

    if (american > 0) {
      return american / 100 + 1;
    } else {
      return 100 / Math.abs(american) + 1;
    }
  }

  // Get sport name from key
  getSportName(sportKey) {
    const sport = this.supportedSports.find((s) => s.key === sportKey);
    return sport ? sport.name : sportKey;
  }

  // Determine event status
  getEventStatus(commence_time) {
    const now = new Date();
    const startTime = new Date(commence_time);
    const timeDiff = startTime.getTime() - now.getTime();

    if (timeDiff < -3 * 60 * 60 * 1000) {
      // More than 3 hours ago
      return "finished";
    } else if (timeDiff < 0) {
      // Started
      return "live";
    } else if (timeDiff < 60 * 60 * 1000) {
      // Starting within 1 hour
      return "starting_soon";
    } else {
      return "upcoming";
    }
  }

  // Start smart updates (conserving API calls)
  startSmartUpdates() {
    // Update priority sports every 15 minutes
    this.updateIntervals.set(
      "priority_events",
      setInterval(
        () => {
          this.updatePriorityEvents();
        },
        15 * 60 * 1000,
      ),
    );

    // Update scores every 10 minutes for live games
    this.updateIntervals.set(
      "scores",
      setInterval(
        () => {
          this.updateLiveScores();
        },
        10 * 60 * 1000,
      ),
    );

    // Check for new events once per hour
    this.updateIntervals.set(
      "new_events",
      setInterval(
        () => {
          this.checkForNewEvents();
        },
        60 * 60 * 1000,
      ),
    );

    console.log("⚡ Smart real-time updates started (API-efficient)");
  }

  // Start mock updates for development
  startMockUpdates() {
    this.updateIntervals.set(
      "mock_updates",
      setInterval(() => {
        this.emitMockUpdates();
      }, 30 * 1000),
    ); // Every 30 seconds

    console.log("🎭 Mock data updates started");
  }

  // Update priority events
  async updatePriorityEvents() {
    try {
      const events = await this.getLiveEvents();

      events.forEach((event) => {
        const previousEvent = this.activeEvents.get(event.id);

        if (
          previousEvent &&
          this.hasOddsChanged(previousEvent.odds, event.odds)
        ) {
          this.emit("odds_update", {
            eventId: event.id,
            event: event,
            changes: this.calculateOddsChanges(previousEvent.odds, event.odds),
            timestamp: new Date().toISOString(),
          });
        }

        this.activeEvents.set(event.id, event);
      });

      this.emit("events_update", events);
    } catch (error) {
      console.error("Error updating priority events:", error.message);
    }
  }

  // Update live scores
  async updateLiveScores() {
    try {
      const scores = await this.getEventsWithScores();

      scores
        .filter((game) => game.scores && !game.completed)
        .forEach((game) => {
          const previousGame = this.activeEvents.get(game.id);

          if (
            previousGame &&
            this.hasScoreChanged(previousGame.scores, game.scores)
          ) {
            this.emit("score_update", {
              eventId: game.id,
              homeTeam: game.homeTeam,
              awayTeam: game.awayTeam,
              scores: game.scores,
              completed: game.completed,
              timestamp: new Date().toISOString(),
            });
          }
        });
    } catch (error) {
      console.error("Error updating live scores:", error.message);
    }
  }

  // Check for new events
  async checkForNewEvents() {
    try {
      const currentEvents = await this.getLiveEvents();
      const newEvents = currentEvents.filter(
        (event) => !this.activeEvents.has(event.id),
      );

      if (newEvents.length > 0) {
        this.emit("new_events", newEvents);
        newEvents.forEach((event) => {
          console.log(
            `🆕 New event: ${event.homeTeam} vs ${event.awayTeam} (${event.sportName})`,
          );
        });
      }
    } catch (error) {
      console.error("Error checking for new events:", error.message);
    }
  }

  // Emit mock updates for development
  emitMockUpdates() {
    const mockEvent = this.generateMockEventUpdate();

    this.emit("odds_update", {
      eventId: mockEvent.id,
      event: mockEvent,
      changes: { moneyline: "updated", spread: "updated" },
      timestamp: new Date().toISOString(),
    });
  }

  // Emit initial data
  async emitInitialData() {
    try {
      const [sports, events] = await Promise.all([
        this.getSports(),
        this.getLiveEvents(),
      ]);

      this.emit("initial_data", {
        sports,
        events,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error emitting initial data:", error.message);
    }
  }

  // Helper functions for change detection
  hasOddsChanged(oldOdds, newOdds) {
    return JSON.stringify(oldOdds) !== JSON.stringify(newOdds);
  }

  hasScoreChanged(oldScores, newScores) {
    if (!oldScores && !newScores) return false;
    if (!oldScores || !newScores) return true;
    return JSON.stringify(oldScores) !== JSON.stringify(newScores);
  }

  calculateOddsChanges(oldOdds, newOdds) {
    const changes = {};

    if (
      oldOdds?.moneyline?.homeTeam?.price !==
      newOdds?.moneyline?.homeTeam?.price
    ) {
      changes.moneylineHome = {
        old: oldOdds?.moneyline?.homeTeam?.price,
        new: newOdds?.moneyline?.homeTeam?.price,
        direction:
          (newOdds?.moneyline?.homeTeam?.price || 0) >
          (oldOdds?.moneyline?.homeTeam?.price || 0)
            ? "up"
            : "down",
      };
    }

    if (
      oldOdds?.moneyline?.awayTeam?.price !==
      newOdds?.moneyline?.awayTeam?.price
    ) {
      changes.moneylineAway = {
        old: oldOdds?.moneyline?.awayTeam?.price,
        new: newOdds?.moneyline?.awayTeam?.price,
        direction:
          (newOdds?.moneyline?.awayTeam?.price || 0) >
          (oldOdds?.moneyline?.awayTeam?.price || 0)
            ? "up"
            : "down",
      };
    }

    return changes;
  }

  // Get service status
  getStatus() {
    return {
      isRunning: this.isRunning,
      mockMode: this.mockMode,
      activeEvents: this.activeEvents.size,
      rateLimits: this.rateLimits,
      cacheSize: this.cache.size,
      supportedSports: this.supportedSports.length,
      uptime: process.uptime(),
    };
  }

  // Stop all updates
  stopUpdates() {
    this.updateIntervals.forEach((interval, key) => {
      clearInterval(interval);
      console.log(`⏹️ Stopped ${key} updates`);
    });

    this.updateIntervals.clear();
    this.isRunning = false;
  }

  // Mock data generators
  getMockLiveEvents(sportKey = null) {
    const mockEvents = [
      {
        id: "mock_nfl_1",
        sport: "americanfootball_nfl",
        sportName: "NFL",
        homeTeam: "Green Bay Packers",
        awayTeam: "Chicago Bears",
        commence_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        status: "upcoming",
        odds: {
          moneyline: {
            homeTeam: { price: -150, decimal: 1.67, bookmaker: "draftkings" },
            awayTeam: { price: 130, decimal: 2.3, bookmaker: "fanduel" },
          },
          spread: {
            homeTeam: {
              point: -3.5,
              price: -110,
              decimal: 1.91,
              bookmaker: "draftkings",
            },
            awayTeam: {
              point: 3.5,
              price: -110,
              decimal: 1.91,
              bookmaker: "fanduel",
            },
          },
          total: {
            over: {
              point: 47.5,
              price: -105,
              decimal: 1.95,
              bookmaker: "draftkings",
            },
            under: {
              point: 47.5,
              price: -115,
              decimal: 1.87,
              bookmaker: "fanduel",
            },
          },
        },
        lastUpdated: new Date().toISOString(),
      },
      {
        id: "mock_nba_1",
        sport: "basketball_nba",
        sportName: "NBA",
        homeTeam: "Los Angeles Lakers",
        awayTeam: "Boston Celtics",
        commence_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        status: "upcoming",
        odds: {
          moneyline: {
            homeTeam: { price: 110, decimal: 2.1, bookmaker: "fanduel" },
            awayTeam: { price: -130, decimal: 1.77, bookmaker: "draftkings" },
          },
          spread: {
            homeTeam: {
              point: 2.5,
              price: -110,
              decimal: 1.91,
              bookmaker: "draftkings",
            },
            awayTeam: {
              point: -2.5,
              price: -110,
              decimal: 1.91,
              bookmaker: "fanduel",
            },
          },
          total: {
            over: {
              point: 215.5,
              price: -110,
              decimal: 1.91,
              bookmaker: "draftkings",
            },
            under: {
              point: 215.5,
              price: -110,
              decimal: 1.91,
              bookmaker: "fanduel",
            },
          },
        },
        lastUpdated: new Date().toISOString(),
      },
    ];

    return sportKey
      ? mockEvents.filter((e) => e.sport === sportKey)
      : mockEvents;
  }

  getMockEventsWithScores() {
    return [
      {
        id: "mock_live_1",
        sport: "basketball_nba",
        sportName: "NBA",
        homeTeam: "Miami Heat",
        awayTeam: "New York Knicks",
        commence_time: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        completed: false,
        scores: [
          { name: "Miami Heat", score: 89 },
          { name: "New York Knicks", score: 94 },
        ],
        lastUpdate: new Date().toISOString(),
      },
    ];
  }

  generateMockEventUpdate() {
    const teams = [
      ["Lakers", "Celtics"],
      ["Warriors", "Heat"],
      ["Packers", "Bears"],
      ["Cowboys", "Giants"],
    ];
    const randomTeams = teams[Math.floor(Math.random() * teams.length)];

    return {
      id: `mock_${Date.now()}`,
      sport: "basketball_nba",
      sportName: "NBA",
      homeTeam: randomTeams[0],
      awayTeam: randomTeams[1],
      commence_time: new Date().toISOString(),
      status: "live",
      odds: {
        moneyline: {
          homeTeam: {
            price: Math.floor(Math.random() * 200) - 200,
            decimal: 1.85,
            bookmaker: "draftkings",
          },
          awayTeam: {
            price: Math.floor(Math.random() * 200) + 100,
            decimal: 2.15,
            bookmaker: "fanduel",
          },
        },
      },
      lastUpdated: new Date().toISOString(),
    };
  }
}

module.exports = FreeOddsService;
