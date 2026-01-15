# Quick Localhost Setup (Simplified)

I see PostgreSQL is having authentication issues. Let me provide you with two options:

## Option 1: Fix PostgreSQL (Recommended for full features)

Run these commands to fix PostgreSQL authentication:

```bash
# Stop PostgreSQL
brew services stop postgresql@14

# Edit pg_hba.conf to allow local connections
echo "local   all             all                                     trust" > /opt/homebrew/var/postgresql@14/pg_hba.conf
echo "host    all             all             127.0.0.1/32            trust" >> /opt/homebrew/var/postgresql@14/pg_hba.conf
echo "host    all             all             ::1/128                 trust" >> /opt/homebrew/var/postgresql@14/pg_hba.conf

# Start PostgreSQL
brew services start postgresql@14

# Wait a moment
sleep 3

# Add PostgreSQL to PATH
export PATH="/opt/homebrew/opt/postgresql@14/bin:$PATH"

# Create database
createdb linkedin_followup

# Import schema
cd "/Users/aayushdivase/hire ai"
psql linkedin_followup < database-schema.sql

# Install backend dependencies
cd backend
npm install

# Create .env file
cat > .env << 'EOF'
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://aayushdivase@localhost:5432/linkedin_followup
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-32chars
JWT_EXPIRES_IN=7d
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
EMAIL_FROM_NAME=LinkedIn Follow-up System
EMAIL_FROM_ADDRESS=your-email@gmail.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=http://localhost:3001
LOG_LEVEL=info
EOF

# Start backend
npm run dev
```

Then in a new terminal:

```bash
# Install frontend dependencies
cd "/Users/aayushdivase/hire ai/frontend"
npm install

# Start frontend
npm run dev
```

## Option 2: Demo Mode (Quick Start - No Email Sending)

If you just want to see the UI quickly without full setup:

```bash
cd "/Users/aayushdivase/hire ai/frontend"
npm install
npm run dev
```

Visit http://localhost:3001 to see the frontend (backend features won't work).

## Manual Setup Instructions

Since the automated setup had authentication issues, here's what you need to do manually:

### 1. Set PostgreSQL Password

```bash
brew services stop postgresql@14
rm -rf /opt/homebrew/var/postgresql@14
/opt/homebrew/opt/postgresql@14/bin/initdb --locale=en_US.UTF-8 -E UTF-8 /opt/homebrew/var/postgresql@14 --no-password
brew services start postgresql@14
sleep 3
export PATH="/opt/homebrew/opt/postgresql@14/bin:$PATH"
createdb linkedin_followup
```

### 2. Import Database Schema

```bash
cd "/Users/aayushdivase/hire ai"
psql linkedin_followup < database-schema.sql
```

You should see output like:
```
CREATE TABLE
CREATE INDEX
CREATE TABLE
...
```

### 3. Setup Backend

```bash
cd backend
npm install
```

Edit `backend/.env` with your email credentials (you'll need a Gmail app password).

### 4. Setup Frontend

```bash
cd frontend
npm install
```

### 5. Start Services

Terminal 1 (Backend):
```bash
cd "/Users/aayushdivase/hire ai/backend"
npm run dev
```

Terminal 2 (Frontend):
```bash
cd "/Users/aayushdivase/hire ai/frontend"
npm run dev
```

## Access the Application

- Frontend: http://localhost:3001
- Backend API: http://localhost:3000/api/v1
- Health Check: http://localhost:3000/health

## Next Steps

1. Visit http://localhost:3001
2. Click "Get Started" to create an account
3. Fill in your profile details
4. Upload your resume
5. Install the Chrome extension
6. Configure the extension with your API token
7. Visit LinkedIn and sync your applications

## Troubleshooting

If you see "ECONNREFUSED" errors:
- Make sure PostgreSQL is running: `brew services list`
- Make sure backend is running on port 3000
- Check backend .env file has correct DATABASE_URL

For help, see the full documentation in README.md
