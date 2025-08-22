#!/bin/bash

# Sportsbook Platform Setup Script
# This script will set up the complete development environment

set -e  # Exit on any error

echo "🚀 Starting Sportsbook Platform Setup..."
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        print_status "Visit: https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    print_success "Node.js $(node --version) ✓"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed."
        exit 1
    fi
    
    print_success "npm $(npm --version) ✓"
    
    # Check MongoDB (optional - will show warning if not found)
    if ! command -v mongod &> /dev/null; then
        print_warning "MongoDB is not installed. You'll need to install it separately or use MongoDB Atlas."
        print_status "Install MongoDB: https://docs.mongodb.com/manual/installation/"
        print_status "Or use MongoDB Atlas: https://www.mongodb.com/atlas"
    else
        print_success "MongoDB $(mongod --version | head -n1 | cut -d' ' -f3) ✓"
    fi
}

# Create necessary directories
create_directories() {
    print_status "Creating project directories..."
    
    mkdir -p server/logs
    mkdir -p server/uploads
    mkdir -p client/public
    mkdir -p client/src/components
    mkdir -p client/src/pages
    mkdir -p client/src/contexts
    mkdir -p client/src/hooks
    mkdir -p client/src/utils
    
    print_success "Directories created ✓"
}

# Install root dependencies
install_root_deps() {
    print_status "Installing root dependencies..."
    
    if [ -f "package.json" ]; then
        npm install
        print_success "Root dependencies installed ✓"
    else
        print_error "package.json not found in root directory"
        exit 1
    fi
}

# Install server dependencies
install_server_deps() {
    print_status "Installing server dependencies..."
    
    if [ -f "server/package.json" ]; then
        cd server
        npm install
        cd ..
        print_success "Server dependencies installed ✓"
    else
        print_error "server/package.json not found"
        exit 1
    fi
}

# Install client dependencies
install_client_deps() {
    print_status "Installing client dependencies..."
    
    if [ -f "client/package.json" ]; then
        cd client
        npm install
        cd ..
        print_success "Client dependencies installed ✓"
    else
        print_error "client/package.json not found"
        exit 1
    fi
}

# Create environment file
create_env_file() {
    print_status "Creating environment configuration..."
    
    if [ ! -f ".env" ]; then
        cp env.example .env
        print_success "Environment file created ✓"
        print_warning "Please edit .env file with your configuration before starting the application"
    else
        print_status "Environment file already exists ✓"
    fi
}

# Setup database
setup_database() {
    print_status "Setting up database..."
    
    # Check if MongoDB is running locally
    if command -v mongod &> /dev/null; then
        if pgrep -x "mongod" > /dev/null; then
            print_success "MongoDB is running locally ✓"
        else
            print_warning "MongoDB is not running. Starting MongoDB..."
            if command -v systemctl &> /dev/null; then
                sudo systemctl start mongod
                print_success "MongoDB started ✓"
            else
                print_warning "Could not start MongoDB automatically. Please start it manually."
            fi
        fi
    else
        print_warning "MongoDB not found locally. Please ensure your MongoDB connection string in .env is correct."
    fi
}

# Create initial data
create_initial_data() {
    print_status "Creating initial data..."
    
    # Create a simple script to initialize the database
    cat > init-db.js << 'EOF'
const mongoose = require('mongoose');
require('dotenv').config();

async function initDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sportsbook');
        console.log('✅ Connected to MongoDB');
        
        // Create collections
        await mongoose.connection.db.createCollection('users');
        await mongoose.connection.db.createCollection('bets');
        await mongoose.connection.db.createCollection('transactions');
        await mongoose.connection.db.createCollection('sports');
        await mongoose.connection.db.createCollection('events');
        
        console.log('✅ Database collections created');
        
        await mongoose.connection.close();
        console.log('✅ Database initialization complete');
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        process.exit(1);
    }
}

initDB();
EOF

    print_success "Database initialization script created ✓"
}

# Create startup scripts
create_startup_scripts() {
    print_status "Creating startup scripts..."
    
    # Create start script
    cat > start.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Sportsbook Platform..."

# Start backend
echo "Starting backend server..."
cd server && npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "Starting frontend..."
cd client && npm start &
FRONTEND_PID=$!

# Function to cleanup on exit
cleanup() {
    echo "🛑 Shutting down..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Trap exit signals
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait
EOF

    chmod +x start.sh
    
    # Create stop script
    cat > stop.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping Sportsbook Platform..."

# Kill Node.js processes
pkill -f "node.*server" 2>/dev/null
pkill -f "node.*client" 2>/dev/null

echo "✅ All processes stopped"
EOF

    chmod +x stop.sh
    
    print_success "Startup scripts created ✓"
}

# Create development scripts
create_dev_scripts() {
    print_status "Creating development scripts..."
    
    # Create backend only script
    cat > start-backend.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting backend server..."
cd server && npm run dev
EOF

    chmod +x start-backend.sh
    
    # Create frontend only script
    cat > start-frontend.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting frontend..."
cd client && npm start
EOF

    chmod +x start-frontend.sh
    
    print_success "Development scripts created ✓"
}

# Create Docker files (optional)
create_docker_files() {
    print_status "Creating Docker configuration..."
    
    # Docker Compose file
    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    container_name: sportsbook-mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
      MONGO_INITDB_DATABASE: sportsbook
    volumes:
      - mongodb_data:/data/db
      - ./init-mongo.js:/docker-entrypoint-initdb.d/init-mongo.js:ro

  redis:
    image: redis:7-alpine
    container_name: sportsbook-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build: ./server
    container_name: sportsbook-backend
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://admin:password@mongodb:27017/sportsbook?authSource=admin
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongodb
      - redis
    volumes:
      - ./server:/app
      - /app/node_modules

  frontend:
    build: ./client
    container_name: sportsbook-frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:5000
    depends_on:
      - backend
    volumes:
      - ./client:/app
      - /app/node_modules

volumes:
  mongodb_data:
  redis_data:
EOF

    # Backend Dockerfile
    cat > server/Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
EOF

    # Frontend Dockerfile
    cat > client/Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
EOF

    # MongoDB initialization script
    cat > init-mongo.js << 'EOF'
db = db.getSiblingDB('sportsbook');

// Create collections
db.createCollection('users');
db.createCollection('bets');
db.createCollection('transactions');
db.createCollection('sports');
db.createCollection('events');

// Create indexes
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });
db.users.createIndex({ "parentAgent": 1 });

db.bets.createIndex({ "user": 1 });
db.bets.createIndex({ "status": 1 });
db.bets.createIndex({ "betSlipId": 1 }, { unique: true });
db.bets.createIndex({ "placedAt": -1 });

db.transactions.createIndex({ "user": 1 });
db.transactions.createIndex({ "type": 1 });
db.transactions.createIndex({ "status": 1 });
db.transactions.createIndex({ "transactionId": 1 }, { unique: true });

db.sports.createIndex({ "slug": 1 }, { unique: true });
db.sports.createIndex({ "isActive": 1 });

db.events.createIndex({ "slug": 1 }, { unique: true });
db.events.createIndex({ "sport": 1 });
db.events.createIndex({ "startTime": 1 });
db.events.createIndex({ "status": 1 });

print('✅ Sportsbook database initialized');
EOF

    print_success "Docker configuration created ✓"
}

# Create README
create_readme() {
    print_status "Creating project documentation..."
    
    cat > DEVELOPMENT.md << 'EOF'
# Sportsbook Platform - Development Guide

## Quick Start

### 1. Start Everything
```bash
./start.sh
```

### 2. Start Backend Only
```bash
./start-backend.sh
```

### 3. Start Frontend Only
```bash
./start-frontend.sh
```

### 4. Stop Everything
```bash
./stop.sh
```

## Development URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health
- **MongoDB**: mongodb://localhost:27017/sportsbook

## Environment Configuration

Edit the `.env` file with your configuration:

```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/sportsbook

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRE=30d

# Commission Configuration
AGENT_COMMISSION_RATE=0.05
SUB_AGENT_COMMISSION_RATE=0.03
MIN_BET_AMOUNT=1.00
MAX_BET_AMOUNT=10000.00
```

## Database Setup

### Option 1: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. The application will create the database automatically

### Option 2: MongoDB Atlas
1. Create a MongoDB Atlas account
2. Create a cluster
3. Get your connection string
4. Update MONGODB_URI in .env

### Option 3: Docker
```bash
docker-compose up -d
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh token

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

## Testing

### Backend Tests
```bash
cd server
npm test
```

### Frontend Tests
```bash
cd client
npm test
```

## Building for Production

### Backend
```bash
cd server
npm run build
```

### Frontend
```bash
cd client
npm run build
```

## Deployment

### Backend
1. Build the application: `npm run build`
2. Set NODE_ENV=production
3. Configure production MongoDB URI
4. Set up environment variables
5. Use PM2 or similar process manager

### Frontend
1. Build the application: `npm run build`
2. Deploy the `build` folder to your web server
3. Configure reverse proxy to backend API

## Troubleshooting

### Common Issues

1. **Port already in use**
   - Change PORT in .env file
   - Kill existing processes: `lsof -ti:5000 | xargs kill -9`

2. **MongoDB connection failed**
   - Check if MongoDB is running
   - Verify connection string in .env
   - Check firewall settings

3. **Frontend can't connect to backend**
   - Verify backend is running on correct port
   - Check CORS configuration
   - Verify proxy setting in client/package.json

4. **JWT errors**
   - Check JWT_SECRET in .env
   - Verify token expiration settings
   - Clear browser localStorage

### Logs

- **Backend logs**: Check server/logs/ directory
- **Frontend logs**: Check browser console
- **MongoDB logs**: Check MongoDB service logs

## Support

For development support:
1. Check the logs
2. Verify environment configuration
3. Test API endpoints with Postman/Insomnia
4. Check browser console for frontend issues
EOF

    print_success "Documentation created ✓"
}

# Main setup function
main() {
    echo ""
    print_status "Starting setup process..."
    
    check_requirements
    create_directories
    install_root_deps
    install_server_deps
    install_client_deps
    create_env_file
    setup_database
    create_initial_data
    create_startup_scripts
    create_dev_scripts
    create_docker_files
    create_readme
    
    echo ""
    echo "🎉 Setup Complete!"
    echo "=================="
    echo ""
    echo "Next steps:"
    echo "1. Edit .env file with your configuration"
    echo "2. Start the application: ./start.sh"
    echo "3. Open http://localhost:3000 in your browser"
    echo ""
    echo "For development:"
    echo "- Backend only: ./start-backend.sh"
    echo "- Frontend only: ./start-frontend.sh"
    echo "- Stop all: ./stop.sh"
    echo ""
    echo "Documentation: DEVELOPMENT.md"
    echo ""
}

# Run main function
main "$@" 