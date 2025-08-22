# Free Sports Betting API Setup Guide 🏈⚽🏀

This guide will help you integrate **real-time sports betting data** into your sportsbook platform using **free APIs**. We've implemented a comprehensive solution that maximizes the free tier benefits while providing professional-grade features.

## 🚀 Quick Start

### 1. Get Your Free API Key

**The Odds API** (Primary - **FREE 500 requests/month**)
- Visit: https://the-odds-api.com
- Click "Get API Key" → "Starter (FREE)"
- Sign up with your email
- Get your API key instantly
- **No credit card required**

### 2. Configure Your Environment

Copy the environment template and add your API key:

```bash
cp env.example .env
```

Edit your `.env` file:
```bash
# Sports Betting APIs
ODDS_API_KEY=your-actual-api-key-here

# Optional fallback APIs (also free)
SPORTMONK_API_KEY=your-sportmonk-key
API_FOOTBALL_KEY=your-api-football-key
```

### 3. Install Dependencies

```bash
# Install server dependencies
cd server && npm install axios

# Install client dependencies  
cd ../client && npm install socket.io-client
```

### 4. Start the Application

```bash
# Start the full stack
npm run dev

# Or start components separately:
npm run server:dev  # Backend only
npm run client:dev  # Frontend only
```

## 📊 What You Get with FREE Tier

### ✅ Features Included
- **Real-time odds** for NFL, NBA, MLB, NHL
- **Live scores** and game status updates
- **WebSocket updates** for instant notifications
- **Smart caching** to maximize API efficiency
- **Multiple bookmakers** (DraftKings, FanDuel, BetMGM)
- **Betting markets**: Moneyline, Spread, Over/Under
- **Mock data mode** for development
- **Automatic rate limiting** protection

### 📈 Data Coverage
| Sport | Free Tier | Update Frequency |
|-------|-----------|------------------|
| NFL   | ✅ Full   | Every 15 minutes |
| NBA   | ✅ Full   | Every 15 minutes |
| MLB   | ✅ Full   | Every 15 minutes |
| NHL   | ✅ Full   | Every 15 minutes |
| EPL   | ✅ Limited | Every 15 minutes |
| NCAA  | ✅ Limited | Every 15 minutes |

## 🔧 API Endpoints Available

### Sports Data
```bash
GET /api/sports                    # Available sports
GET /api/sports/events             # All events with odds
GET /api/sports/live               # Live games only
GET /api/sports/upcoming           # Upcoming games
GET /api/sports/scores             # Current scores
GET /api/sports/event/:id          # Specific event details
```

### Service Management
```bash
GET /api/sports/status             # API usage & service status
POST /api/sports/refresh           # Manual data refresh
GET /api/sports/bookmakers         # Supported bookmakers
GET /api/sports/markets            # Available betting markets
```

## 🎯 Example API Responses

### Live Events Response
```json
{
  "success": true,
  "data": [
    {
      "id": "event123",
      "sport": "americanfootball_nfl",
      "sportName": "NFL",
      "homeTeam": "Green Bay Packers",
      "awayTeam": "Chicago Bears",
      "commence_time": "2024-01-15T20:00:00Z",
      "status": "upcoming",
      "odds": {
        "moneyline": {
          "homeTeam": { "price": -150, "decimal": 1.67, "bookmaker": "draftkings" },
          "awayTeam": { "price": 130, "decimal": 2.30, "bookmaker": "fanduel" }
        },
        "spread": {
          "homeTeam": { "point": -3.5, "price": -110, "bookmaker": "draftkings" },
          "awayTeam": { "point": 3.5, "price": -110, "bookmaker": "fanduel" }
        },
        "total": {
          "over": { "point": 47.5, "price": -105, "bookmaker": "draftkings" },
          "under": { "point": 47.5, "price": -115, "bookmaker": "fanduel" }
        }
      },
      "lastUpdated": "2024-01-15T18:30:00Z"
    }
  ],
  "meta": {
    "count": 1,
    "source": "live_api",
    "timestamp": "2024-01-15T18:30:00Z"
  }
}
```

### Service Status Response
```json
{
  "success": true,
  "data": {
    "service": {
      "isRunning": true,
      "mockMode": false,
      "activeEvents": 25,
      "cacheSize": 15,
      "supportedSports": 8
    },
    "api_info": {
      "free_tier_limit": "500 requests/month",
      "daily_limit": 17,
      "requests_used_today": 5,
      "total_remaining": 495,
      "cache_enabled": true,
      "real_time_updates": true
    },
    "upgrade_options": {
      "paid_tier": "https://the-odds-api.com/#get-access",
      "benefits": [
        "Up to 5M requests/month",
        "Historical odds data",
        "More bookmakers",
        "Faster update frequency",
        "Player props & alternate markets"
      ]
    }
  }
}
```

## ⚡ Real-Time WebSocket Events

Your frontend automatically receives these real-time updates:

```javascript
// Socket connection in React
const socket = io('http://localhost:5000');

// Listen for odds changes
socket.on('odds_update', (data) => {
  console.log('Odds changed:', data.event);
  console.log('What changed:', data.changes);
});

// Listen for live score updates
socket.on('score_update', (data) => {
  console.log('Score update:', data.scores);
});

// Listen for new games
socket.on('new_events', (newGames) => {
  console.log('New games available:', newGames);
});
```

## 💡 Smart Rate Limiting

The system automatically manages API usage:

- **Daily Budget**: ~17 requests per day (500/month ÷ 30 days)
- **Smart Caching**: 10-minute cache to avoid duplicate calls
- **Priority Sports**: Focuses on NFL, NBA, MLB, NHL first
- **Fallback Mode**: Switches to mock data when limit reached
- **Usage Tracking**: Real-time monitoring of API consumption

## 🛠️ Frontend Integration

Add the SportsOdds component to your app:

```jsx
import SportsOdds from './components/SportsOdds';

function App() {
  return (
    <div className="App">
      <SportsOdds />
    </div>
  );
}
```

## 🎭 Development Mode

No API key? No problem! The system includes rich mock data:

```bash
# Start without API key - automatically uses mock data
npm run dev
```

Mock data includes:
- Sample NFL, NBA games
- Realistic odds from major bookmakers
- Live score simulations
- Real-time update demonstrations

## 🔍 Monitoring & Debugging

### Check Service Status
```bash
curl http://localhost:5000/api/sports/status
```

### Monitor Logs
```bash
# Server logs show API usage
npm run server:dev

# Look for these messages:
# ✅ The Odds API connection successful
# 📊 API Usage: 5/17 today, 495 total remaining
# 📱 Using cached data for: /sports
```

### Test API Endpoints
```bash
# Get available sports
curl http://localhost:5000/api/sports

# Get live events
curl http://localhost:5000/api/sports/events

# Force refresh (uses API call)
curl -X POST http://localhost:5000/api/sports/refresh
```

## 🚀 Alternative Free APIs

If you need more data, consider these free alternatives:

### 1. SportMonk API
- **Free tier**: 100 requests/day
- **Coverage**: Soccer, Basketball, Football
- **Signup**: https://www.sportmonks.com/

### 2. API-Football
- **Free tier**: 100 requests/day  
- **Coverage**: Soccer focused
- **Signup**: https://www.api-football.com/

### 3. ESPN Hidden APIs (Unofficial)
- **Coverage**: All major sports
- **Limitations**: No official support, may break
- **Example**: `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard`

## 📈 Upgrade Path

When you're ready for more features:

### Paid Tiers Available

| Tier | Price | Requests/Month | Features |
|------|-------|----------------|----------|
| Starter | FREE | 500 | Basic markets |
| 20K | $30/mo | 20,000 | All bookmakers |
| 100K | $59/mo | 100,000 | Historical data |
| 5M | $119/mo | 5,000,000 | Premium support |

### Premium Features
- **Player props** (touchdown scorers, rebounds, etc.)
- **Alternate lines** (different spreads/totals)
- **Futures betting** (championship odds)
- **Historical data** (past odds and results)
- **More bookmakers** (50+ worldwide)
- **Faster updates** (every 5 minutes)

## 🔧 Troubleshooting

### Common Issues

**1. API Key Not Working**
```bash
# Check your .env file
cat .env | grep ODDS_API_KEY

# Test the key manually
curl "https://api.the-odds-api.com/v4/sports?apiKey=YOUR_KEY"
```

**2. No Data Showing**
- Service automatically falls back to mock data
- Check browser console for error messages
- Verify server is running on port 5000

**3. Rate Limit Exceeded**
```json
{
  "success": false,
  "message": "Daily API limit reached. Data will be served from cache."
}
```
- Normal behavior - resets at midnight
- Cached data still available
- Consider upgrading if you need more

**4. Real-time Updates Not Working**
- Check WebSocket connection in browser dev tools
- Verify Socket.IO is properly connected
- Ensure no firewall blocking WebSocket traffic

### Debug Mode

Enable detailed logging:
```bash
# Add to your .env
LOG_LEVEL=debug

# Start server
npm run server:dev
```

## 🎯 Best Practices

### 1. Efficient API Usage
- Use caching aggressively
- Focus on priority sports
- Batch requests when possible
- Monitor usage daily

### 2. User Experience  
- Show connection status
- Display last update time
- Handle loading states gracefully
- Provide fallback data

### 3. Error Handling
- Graceful degradation to cached data
- Clear error messages to users
- Automatic retry logic
- Monitoring and alerts

### 4. Security
- Never expose API keys in frontend
- Implement rate limiting on your endpoints
- Validate all incoming data
- Use HTTPS in production

## 🎉 You're All Set!

Your sportsbook now has:
- ✅ **Real-time sports odds** from major bookmakers
- ✅ **Live scores** and game status updates  
- ✅ **Professional UI** with real-time updates
- ✅ **Smart API management** that maximizes free tier
- ✅ **WebSocket integration** for instant notifications
- ✅ **Development-friendly** mock data mode

Visit http://localhost:3000 to see your live sports odds in action! 🚀

## 📞 Support & Resources

- **The Odds API Docs**: https://the-odds-api.com/liveapi/guides/v4/
- **GitHub Issues**: Create issues in your repository
- **API Status**: Check https://status.the-odds-api.com/
- **Community**: Join sports betting API discussions

Happy coding! 🏆