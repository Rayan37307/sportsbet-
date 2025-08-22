# Sportsbook Platform Setup Guide

## ✅ Issues Fixed

### 1. TypeScript Compatibility Issue
- **Problem**: `react-scripts@5.0.1` was incompatible with TypeScript 5.x
- **Solution**: Downgraded TypeScript to version 4.9.5 for compatibility
- **Result**: Client dependencies now install successfully

### 2. Problematic Dependencies
- **Problem**: `react-suspense@^0.0.1` package was causing installation failures
- **Solution**: Removed the problematic package from dependencies
- **Result**: Clean installation without errors

## 🚀 Quick Start

### 1. Install Dependencies
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install

# Return to root
cd ..
```

### 2. Environment Configuration
Create a `.env` file in the root directory:

```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/sportsbook?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRE=30d

# Other configurations...
```

### 3. MongoDB Atlas Setup
Follow the detailed guide in `mongodb-atlas-config.md` to:
- Create MongoDB Atlas account
- Set up database cluster
- Configure network access
- Get connection string

### 4. Start Development
```bash
# Start both server and client
npm run dev

# Or start individually:
npm run server:dev    # Server on port 5000
npm run client:dev    # Client on port 3000
```

## 🔧 Development Scripts

- `npm run dev` - Start both server and client in development mode
- `npm run server:dev` - Start server only
- `npm run client:dev` - Start client only
- `npm run build` - Build both server and client
- `npm run install:all` - Install all dependencies

## 📁 Project Structure

```
application-22-8-betting/
├── client/                 # React frontend
│   ├── src/               # Source code
│   ├── package.json       # Frontend dependencies
│   └── ...
├── server/                 # Node.js backend
│   ├── routes/            # API routes
│   ├── models/            # MongoDB models
│   ├── middleware/        # Express middleware
│   ├── services/          # Business logic
│   └── package.json       # Backend dependencies
├── package.json            # Root package.json
├── .env                    # Environment variables
└── README.md              # Project documentation
```

## 🗄️ Database Models

The platform includes models for:
- Users (players, agents, admins)
- Sports and events
- Bets and transactions
- Wallets and payments
- Sessions and authentication

## 🔐 Security Features

- JWT authentication
- Rate limiting
- Input validation
- Helmet security headers
- CORS configuration
- Session management with MongoDB store

## 🌐 API Endpoints

- `/api/auth` - Authentication routes
- `/api/users` - User management
- `/api/betting` - Betting operations
- `/api/admin` - Admin functions
- `/api/agents` - Agent operations

## 📱 Frontend Features

- React 18 with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- Socket.io for real-time updates
- State management with Zustand
- Form handling with React Hook Form

## 🚨 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Kill process on port 5000
   sudo lsof -ti:5000 | xargs kill -9
   ```

2. **MongoDB connection failed**
   - Check your `.env` file
   - Verify MongoDB Atlas network access
   - Ensure connection string is correct

3. **Client build fails**
   ```bash
   cd client
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **TypeScript errors**
   - Ensure TypeScript version is 4.9.5
   - Check for type definition conflicts

## 🔄 Updates and Maintenance

- Regularly update dependencies
- Monitor security vulnerabilities
- Keep MongoDB Atlas updated
- Test thoroughly before production deployment

## 📞 Support

For issues or questions:
1. Check this setup guide
2. Review the MongoDB Atlas configuration
3. Check console logs for error details
4. Verify environment variables are set correctly 