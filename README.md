# Sportsbook Platform

A comprehensive online sportsbook platform similar to DGS, featuring user management, betting engine, real-time updates, and multi-level agent hierarchy.

## 🏗️ Project Structure

```
sportsbook-platform/
├── server/                 # Backend API (Node.js + Express)
│   ├── config/            # Database and app configuration
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Custom middleware
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   └── utils/             # Helper functions
├── client/                # Frontend (React.js)
│   ├── public/            # Static assets
│   ├── src/               # React components
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context
│   │   ├── hooks/         # Custom hooks
│   │   └── utils/         # Frontend utilities
│   └── package.json       # Frontend dependencies
└── package.json           # Root package.json
```

## 🚀 Features

### For Players
- User registration and authentication
- Wallet management (deposits/withdrawals)
- Browse sports and events
- Place bets with real-time odds
- Track bet history and results
- Live score updates

### For Agents/Sub-agents
- Player recruitment and management
- Commission tracking and earnings
- Performance analytics
- Player activity monitoring

### For Admins
- User management and moderation
- Odds management and updates
- Financial reports and analytics
- Platform configuration
- Payment processing

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js, MongoDB
- **Frontend**: React.js, Socket.io-client
- **Real-time**: WebSockets (Socket.io)
- **Authentication**: JWT tokens
- **Security**: bcrypt, helmet, rate limiting
- **Database**: MongoDB with Mongoose ODM

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- npm or yarn

## 🔧 Installation & Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd sportsbook-platform
   npm run install:all
   ```

2. **Environment setup:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start development servers:**
   ```bash
   npm run dev
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 🗄️ Database Setup

The platform uses MongoDB with the following main collections:
- Users (players, agents, admins)
- Bets and transactions
- Sports and events
- Odds and results
- Commissions and payouts

## 🔐 Security Features

- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt
- Rate limiting and CORS protection
- Input validation and sanitization
- Helmet security headers

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/wallet` - Get wallet info

### Betting
- `GET /api/sports` - Get available sports
- `GET /api/events` - Get events by sport
- `POST /api/bets` - Place a bet
- `GET /api/bets/history` - Get bet history

### Admin
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/odds` - Update odds
- `GET /api/admin/reports` - Get reports

## 🚀 Deployment

The platform is designed to be deployed on Hostinger with:
- Environment variable configuration
- Production build optimization
- Database connection management
- SSL certificate setup

## 📊 Development Workflow

1. **Backend First**: Implement core APIs and database models
2. **Frontend Development**: Build user interface and admin dashboard
3. **Integration**: Connect frontend and backend
4. **Real-time Features**: Implement WebSocket functionality
5. **Testing**: Comprehensive testing of all features
6. **Deployment**: Deploy to production environment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please contact the development team. 