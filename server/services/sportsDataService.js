const axios = require('axios');
const WebSocket = require('ws');
const EventEmitter = require('events');

class SportsDataService extends EventEmitter {
  constructor() {
    super();
    this.apiKey = process.env.ODDS_API_KEY;
    this.sportsRadarKey = process.env.SPORTSRADAR_API_KEY;
    this.baseUrl = 'https://api.the-odds-api.com/v4';
    this.sportsRadarUrl = 'https://api.sportradar.us';
    this.updateIntervals = new Map();
    this.activeEvents = new Map();
    this.isRunning = false;
    this.rateLimits = {
      oddsApi: { remaining: 500, resetTime: Date.now() + 86400000 }, // 24 hours
      sportsRadar: { remaining: 1000, resetTime: Date.now() + 86400000 }
    };
  }

  // Initialize the service
  async initialize() {
    console.log('🏈 Initializing Sports Data Service...');

    try {
      await this.testConnections();
      this.startRealTimeUpdates();
      this.isRunning = true;
      console.log('✅ Sports Data Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Sports Data Service:', error);
      throw error;
    }
  }

  // Test API connections
  async testConnections() {
    const tests = [];

    // Test The Odds API
    if (this.apiKey) {
      tests.push(this.testOddsAPI());
    }

    // Test SportsRadar API
    if (this.sportsRadarKey) {
      tests.push(this.testSportsRadarAPI());
    }

    if (tests.length === 0) {
      throw new Error('No API keys configured');
    }

    await Promise.all(tests);
  }

  async testOddsAPI() {
    try {
      const response = await axios.get(`${this.baseUrl}/sports`, {
        params: { apiKey: this.apiKey }
      });

      this.updateRateLimit('oddsApi', response.headers);
      console.log('✅ The Odds API connection successful');
    } catch (error) {
      console.error('❌ The Odds API test failed:', error.message);
      throw error;
    }
  }

  async testSportsRadarAPI() {
    try {
      const response = await axios.get(`${this.sportsRadarUrl}/nba/trial/v8/en/games/2024/REG/schedule.json`, {
        params: { api_key: this.sportsRadarKey }
      });

      this.updateRateLimit('sportsRadar', response.headers);
      console.log('✅ SportsRadar API connection successful');
    } catch (error) {
      console.error('❌ SportsRadar API test failed:', error.message);
      throw error;
    }
  }

  // Get available sports
  async getSports() {
    try {
      const response = await axios.get(`${this.baseUrl}/sports`, {
        params: { apiKey: this.apiKey }
      });

      this.updateRateLimit('oddsApi', response.headers);

      return response.data.map(sport => ({
        id: sport.key,
        name: sport.title,
        active: sport.active,
        hasOutrights: sport.has_outrights
      }));
    } catch (error) {
      console.error('Error fetching sports:', error);
      return this.getMockSports();
    }
  }

  // Get live events for a sport
  async getLiveEvents(sport = 'all') {
    try {
      const sportKey = sport === 'all' ? 'upcoming' : sport;
      const response = await axios.get(`${this.baseUrl}/sports/${sportKey}/odds`, {
        params: {
          apiKey: this.apiKey,
          regions: 'us,us2',
          markets: 'h2h,spreads,totals',
          oddsFormat: 'american',
          bookmakers: 'draftkings,fanduel,betmgm'
        }
      });

      this.updateRateLimit('oddsApi', response.headers);

      return this.transformEventsData(response.data);
    } catch (error) {
      console.error('Error fetching live events:', error);
      return this.getMockLiveEvents();
    }
  }

  // Get live scores
  async getLiveScores() {
    try {
      const response = await axios.get(`${this.baseUrl}/sports/upcoming/scores`, {
        params: {
          apiKey: this.apiKey,
          daysFrom: 0,
          daysTo: 1
        }
      });

      this.updateRateLimit('oddsApi', response.headers);

      return response.data.map(game => ({
        id: game.id,
        sport: game.sport_key,
        team1: game.home_team,
        team2: game.away_team,
        score: {
          team1: game.scores ? game.scores.find(s => s.name === game.home_team)?.score : 0,
          team2: game.scores ? game.scores.find(s => s.name === game.away_team)?.score : 0
        },
        status: game.completed ? 'finished' : 'live',
        lastUpdated: game.last_update
      }));
    } catch (error) {
      console.error('Error fetching live scores:', error);
      return [];
    }
  }

  // Start real-time updates
  startRealTimeUpdates() {
    // Update odds every 10 seconds for live events
    this.updateIntervals.set('odds', setInterval(() => {
      this.updateLiveOdds();
    }, 10000));

    // Update scores every 5 seconds
    this.updateIntervals.set('scores', setInterval(() => {
      this.updateLiveScores();
    }, 5000));

    // Check for new events every minute
    this.updateIntervals.set('events', setInterval(() => {
      this.checkForNewEvents();
    }, 60000));

    console.log('⚡ Real-time updates started');
  }

  // Update live odds
  async updateLiveOdds() {
    try {
      const liveEvents = await this.getLiveEvents();

      liveEvents.forEach(event => {
        const previousEvent = this.activeEvents.get(event.id);

        if (previousEvent && this.hasOddsChanged(previousEvent.odds, event.odds)) {
          this.emit('odds_update', {
            eventId: event.id,
            odds: event.odds,
            changes: this.calculateOddsChanges(previousEvent.odds, event.odds)
          });
        }

        this.activeEvents.set(event.id, event);
      });
    } catch (error) {
      console.error('Error updating live odds:', error);
    }
  }

  // Update live scores
  async updateLiveScores() {
    try {
      const scores = await this.getLiveScores();

      scores.forEach(game => {
        const previousGame = this.activeEvents.get(game.id);

        if (previousGame && this.hasScoreChanged(previousGame.score, game.score)) {
          this.emit('score_update', {
            eventId: game.id,
            score: game.score,
            team1: game.team1,
            team2: game.team2,
            status: game.status
          });
        }
      });
    } catch (error) {
      console.error('Error updating live scores:', error);
    }
  }

  // Check for new events
  async checkForNewEvents() {
    try {
      const currentEvents = await this.getLiveEvents();

      currentEvents.forEach(event => {
        if (!this.activeEvents.has(event.id)) {
          this.emit('new_event', event);
          console.log(`🆕 New event detected: ${event.team1} vs ${event.team2}`);
        }
      });
    } catch (error) {
      console.error('Error checking for new events:', error);
    }
  }

  // Transform API data to our format
  transformEventsData(data) {
    return data.map(event => {
      const odds = this.extractOdds(event.bookmakers);

      return {
        id: event.id,
        sport: event.sport_key,
        league: event.sport_title,
        team1: event.home_team,
        team2: event.away_team,
        startTime: event.commence_time,
        status: this.determineEventStatus(event),
        odds: odds,
        bookmakers: event.bookmakers.map(b => b.key),
        lastUpdated: new Date().toISOString()
      };
    });
  }

  // Extract odds from bookmaker data
  extractOdds(bookmakers) {
    if (!bookmakers || bookmakers.length === 0) return null;

    // Use first available bookmaker (could be made configurable)
    const bookmaker = bookmakers[0];
    const odds = {};

    bookmaker.markets.forEach(market => {
      switch (market.key) {
        case 'h2h':
          odds.moneyline = {
            team1: this.americanToDecimal(market.outcomes.find(o => o.name === bookmaker.title)?.price),
            team2: this.americanToDecimal(market.outcomes.find(o => o.name !== bookmaker.title)?.price)
          };
          break;

        case 'spreads':
          const spread1 = market.outcomes[0];
          const spread2 = market.outcomes[1];
          odds.spread = {
            team1Points: spread1.point,
            team1Odds: this.americanToDecimal(spread1.price),
            team2Points: spread2.point,
            team2Odds: this.americanToDecimal(spread2.price)
          };
          break;

        case 'totals':
          const over = market.outcomes.find(o => o.name === 'Over');
          const under = market.outcomes.find(o => o.name === 'Under');
          odds.total = {
            points: over?.point,
            overOdds: this.americanToDecimal(over?.price),
            underOdds: this.americanToDecimal(under?.price)
          };
          break;
      }
    });

    return odds;
  }

  // Convert American odds to decimal
  americanToDecimal(american) {
    if (!american) return null;

    if (american > 0) {
      return (american / 100) + 1;
    } else {
      return (100 / Math.abs(american)) + 1;
    }
  }

  // Determine event status
  determineEventStatus(event) {
    const now = new Date();
    const startTime = new Date(event.commence_time);

    if (startTime <= now) {
      return 'live';
    }

    return 'upcoming';
  }

  // Check if odds have changed
  hasOddsChanged(oldOdds, newOdds) {
    if (!oldOdds || !newOdds) return false;

    return JSON.stringify(oldOdds) !== JSON.stringify(newOdds);
  }

  // Check if score has changed
  hasScoreChanged(oldScore, newScore) {
    if (!oldScore || !newScore) return false;

    return oldScore.team1 !== newScore.team1 || oldScore.team2 !== newScore.team2;
  }

  // Calculate odds changes
  calculateOddsChanges(oldOdds, newOdds) {
    const changes = {};

    if (oldOdds.moneyline && newOdds.moneyline) {
      if (oldOdds.moneyline.team1 !== newOdds.moneyline.team1) {
        changes.moneylineTeam1 = {
          old: oldOdds.moneyline.team1,
          new: newOdds.moneyline.team1,
          direction: newOdds.moneyline.team1 > oldOdds.moneyline.team1 ? 'up' : 'down'
        };
      }

      if (oldOdds.moneyline.team2 !== newOdds.moneyline.team2) {
        changes.moneylineTeam2 = {
          old: oldOdds.moneyline.team2,
          new: newOdds.moneyline.team2,
          direction: newOdds.moneyline.team2 > oldOdds.moneyline.team2 ? 'up' : 'down'
        };
      }
    }

    return changes;
  }

  // Update rate limit tracking
  updateRateLimit(api, headers) {
    if (headers['x-requests-remaining']) {
      this.rateLimits[api].remaining = parseInt(headers['x-requests-remaining']);
    }

    if (headers['x-requests-used']) {
      console.log(`📊 ${api} requests used:`, headers['x-requests-used']);
    }
  }

  // Stop all updates
  stopRealTimeUpdates() {
    this.updateIntervals.forEach((interval, key) => {
      clearInterval(interval);
      console.log(`⏹️ Stopped ${key} updates`);
    });

    this.updateIntervals.clear();
    this.isRunning = false;
  }

  // Get service status
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeEvents: this.activeEvents.size,
      rateLimits: this.rateLimits,
      uptime: process.uptime()
    };
  }

  // Mock data for development/fallback
  getMockSports() {
    return [
      { id: 'basketball_nba', name: 'NBA', active: true },
      { id: 'americanfootball_nfl', name: 'NFL', active: true },
      { id: 'baseball_mlb', name: 'MLB', active: true },
      { id: 'icehockey_nhl', name: 'NHL', active: true },
      { id: 'soccer_epl', name: 'English Premier League', active: true }
    ];
  }

  getMockLiveEvents() {
    return [
      {
        id: 'mock_1',
        sport: 'basketball_nba',
        league: 'NBA',
        team1: 'Los Angeles Lakers',
        team2: 'Golden State Warriors',
        startTime: new Date().toISOString(),
        status: 'live',
        odds: {
          moneyline: { team1: 1.85, team2: 2.05 },
          spread: { team1Points: -3.5, team1Odds: 1.9, team2Points: 3.5, team2Odds: 1.9 },
          total: { points: 215.5, overOdds: 1.85, underOdds: 1.95 }
        },
        lastUpdated: new Date().toISOString()
      }
    ];
  }
}

module.exports = SportsDataService;
