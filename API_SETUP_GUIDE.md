# Sports API Setup Guide

This guide will help you transition from demo mode to live sports data using The Odds API.

## Current Status

Your sportsbook is currently running in **Demo Mode** with simulated data. To get real-time sports odds and live data, you need to configure a free API key.

## Quick Setup (5 minutes)

### Step 1: Get Your Free API Key

1. Visit [The Odds API](https://the-odds-api.com/)
2. Click "Get API Key" or "Sign Up"
3. Create a free account
4. Copy your API key from the dashboard

### Step 2: Configure Your Environment

1. Open your `.env` file in the project root
2. Add or update this line:
   ```
   ODDS_API_KEY=your-api-key-here
   ```
3. Replace `your-api-key-here` with your actual API key

### Step 3: Restart Your Server

```bash
# Stop your current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 4: Verify Setup

1. Go to your Sports page
2. Look for "Live Data Feed" instead of "Demo Mode Active"
3. Check that odds are updating with real data

## Free Tier Limits

- **500 API requests per month**
- **17 requests per day** (automatically managed)
- **Real-time data** for major sports
- **Multiple bookmakers** (DraftKings, FanDuel, etc.)

## Supported Sports (Free Tier)

### Priority Sports (Always Available)
- 🏈 **NFL** - American Football
- 🏀 **NBA** - Basketball  
- ⚾ **MLB** - Baseball
- 🏒 **NHL** - Ice Hockey

### Secondary Sports
- ⚽ **Premier League** - Soccer
- 🏆 **Champions League** - Soccer
- 🎓 **College Football** - NCAA
- 🎓 **College Basketball** - NCAA

## Environment Variables Reference

```bash
# Required for live data
ODDS_API_KEY=your-odds-api-key

# Optional: Alternative APIs (for future expansion)
SPORTMONK_API_KEY=your-sportmonk-key
API_FOOTBALL_KEY=your-api-football-key
```

## Troubleshooting

### Still Seeing Demo Mode?

1. **Check your .env file**
   - Ensure `ODDS_API_KEY=your-actual-key`
   - No spaces around the `=`
   - Key is on its own line

2. **Restart the server**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

3. **Check server logs**
   - Look for "✅ The Odds API connection successful"
   - If you see "⚠️ No Odds API key found", the key isn't loaded

4. **Verify API key**
   - Test at: `https://api.the-odds-api.com/v4/sports?apiKey=YOUR_KEY`
   - Should return JSON with sports list

### Rate Limiting

The app automatically manages your API usage:
- **Smart caching** reduces unnecessary requests
- **Real-time updates** via WebSocket when possible
- **Automatic throttling** to stay under daily limits

### Error Messages

| Error | Solution |
|-------|----------|
| "Invalid API key" | Check your key is correct |
| "Rate limit exceeded" | Wait until tomorrow or upgrade plan |
| "Connection failed" | Check internet connection |
| "Demo mode active" | API key not configured |

## Upgrading Your Plan

When you need more requests:

1. Visit [The Odds API Pricing](https://the-odds-api.com/#get-access)
2. Choose a paid plan (starting at $10/month)
3. Update your API key in `.env`
4. Restart your server

### Paid Plan Benefits
- **Up to 5M requests/month**
- **Historical odds data**
- **More bookmakers**
- **Faster update frequency**
- **Player props & alternate markets**
- **Live scores & game status**

## Professional Features

Once your API is configured, you get:

### ✅ Real-Time Data
- Live odds updates
- Game status changes
- Score updates
- Event notifications

### ✅ Multiple Markets
- **Moneyline** - Win/loss betting
- **Point Spread** - Margin betting  
- **Over/Under** - Total points betting

### ✅ Professional UI
- Live connection status
- Real-time update indicators
- Professional odds display
- Responsive design

### ✅ Smart Features
- Favorites system
- Advanced filtering
- Search functionality
- Auto-refresh

## Security Notes

- **Never commit** your API key to version control
- **Keep your .env file** in `.gitignore`
- **Use environment variables** in production
- **Rotate keys regularly** for security

## Production Deployment

For production environments:

1. **Set environment variables** on your hosting platform
2. **Use secure key management** (AWS Secrets Manager, etc.)
3. **Monitor API usage** to avoid overages
4. **Set up alerts** for rate limiting

## Support & Resources

- 📧 **API Support**: [The Odds API Documentation](https://the-odds-api.com/liveapi/guides/v4/)
- 💬 **Community**: Join Discord for help
- 📚 **Documentation**: See `/docs` folder
- 🐛 **Issues**: Create GitHub issues for bugs

## Quick Test

Test your setup with this curl command:

```bash
curl "https://api.the-odds-api.com/v4/sports?apiKey=YOUR_API_KEY"
```

Should return:
```json
[
  {
    "key": "americanfootball_nfl",
    "active": true,
    "group": "American Football",
    "description": "NFL",
    "title": "NFL"
  }
]
```

---

**Ready to go live?** Follow the steps above and transform your sportsbook from demo to professional-grade live data! 🚀