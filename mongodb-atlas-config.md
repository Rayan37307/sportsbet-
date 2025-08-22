# MongoDB Atlas Configuration

## Setup Instructions

### 1. Create MongoDB Atlas Account
- Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
- Sign up for a free account
- Create a new project

### 2. Create Database Cluster
- Choose "Build a Database"
- Select "FREE" tier (M0)
- Choose your preferred cloud provider and region
- Click "Create"

### 3. Configure Database Access
- Go to "Database Access" in the left sidebar
- Click "Add New Database User"
- Create a username and password
- Select "Read and write to any database"
- Click "Add User"

### 4. Configure Network Access
- Go to "Network Access" in the left sidebar
- Click "Add IP Address"
- For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
- For production: Add your specific IP addresses
- Click "Confirm"

### 5. Get Connection String
- Go to "Database" in the left sidebar
- Click "Connect"
- Choose "Connect your application"
- Copy the connection string

### 6. Update Environment Variables
Replace the following in your `.env` file:

```bash
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/sportsbook?retryWrites=true&w=majority
MONGODB_URI_PROD=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/sportsbook-prod?retryWrites=true&w=majority
```

### 7. Connection String Format
```
mongodb+srv://username:password@cluster-name.xxxxx.mongodb.net/database-name?retryWrites=true&w=majority
```

### 8. Environment File Template
Create a `.env` file in your project root with:

```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/sportsbook?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d

# Other configurations...
```

### 9. Test Connection
After updating the environment variables, restart your server and check the console for successful MongoDB connection.

### 10. Security Notes
- Never commit your `.env` file to version control
- Use strong passwords for database users
- Restrict network access to only necessary IPs in production
- Regularly rotate database passwords
- Use environment-specific connection strings for different deployment stages 