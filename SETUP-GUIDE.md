# Quick Setup Guide

This guide will get you up and running in under 10 minutes.

## Step 1: Install Prerequisites (2 minutes)

### macOS
```bash
# Install Homebrew if not installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js and PostgreSQL
brew install node postgresql@14

# Start PostgreSQL
brew services start postgresql@14
```

### Ubuntu/Debian
```bash
# Update package list
sudo apt update

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Windows
1. Download and install Node.js from https://nodejs.org/
2. Download and install PostgreSQL from https://www.postgresql.org/download/windows/

## Step 2: Create Database (1 minute)

```bash
# Create database
createdb linkedin_followup

# Import schema
psql linkedin_followup < database-schema.sql

# Verify tables created
psql linkedin_followup -c "\dt"
```

## Step 3: Backend Setup (2 minutes)

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env - REQUIRED fields:
# - DATABASE_URL=postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/linkedin_followup
# - JWT_SECRET=generate-a-random-32-character-string-here
# - EMAIL_USER=your-gmail@gmail.com
# - EMAIL_PASSWORD=your-gmail-app-password

# On macOS/Linux:
nano .env

# On Windows:
notepad .env

# Start backend
npm run dev
```

Backend should be running at http://localhost:3000

## Step 4: Frontend Setup (2 minutes)

```bash
# Open new terminal
cd frontend

# Install dependencies
npm install

# Start frontend
npm run dev
```

Frontend should be running at http://localhost:3001

## Step 5: Setup Gmail for Emails (2 minutes)

1. Go to https://myaccount.google.com/
2. Click "Security" → "2-Step Verification" → Enable it
3. Go to https://myaccount.google.com/apppasswords
4. Generate new app password for "Mail"
5. Copy the 16-character password
6. Paste it in `backend/.env` as `EMAIL_PASSWORD`

## Step 6: Create Account (1 minute)

1. Open http://localhost:3001
2. Click "Get Started"
3. Fill in signup form:
   - Full Name
   - Email
   - Password (min 8 characters)
   - Preferred Email (for sending)
   - Phone Number
4. Click "Create Account"

## Step 7: Upload Resume (1 minute)

1. Navigate to Dashboard → Resume
2. Click "Choose File"
3. Select your PDF resume (max 5MB)
4. Click "Upload"
5. Verify upload success

## Step 8: Install Chrome Extension (1 minute)

1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Navigate to and select the `chrome-extension/` folder
6. Extension should appear in toolbar

## Step 9: Configure Extension (1 minute)

1. Navigate to Dashboard → LinkedIn Setup in web app
2. Copy your API token (automatically displayed)
3. Right-click extension icon → "Options"
4. Paste API token
5. Click "Test Connection" to verify
6. Click "Save Settings"

## Step 10: Sync and Send (2 minutes)

1. Open https://www.linkedin.com/jobs/ in Chrome
2. Browse to your applied jobs
3. Click the extension icon
4. Click "Sync LinkedIn Applications"
5. Wait for sync to complete
6. Go back to Dashboard in web app
7. Select applications to follow up
8. Click "Send Emails"

## Verification Checklist

- [ ] PostgreSQL is running
- [ ] Backend server running at http://localhost:3000
- [ ] Frontend running at http://localhost:3001
- [ ] Can access /health endpoint: http://localhost:3000/health
- [ ] Created user account successfully
- [ ] Uploaded resume successfully
- [ ] Chrome extension installed and configured
- [ ] Synced at least one LinkedIn application
- [ ] Email sent successfully

## Common Issues

### "Database connection failed"
- Check PostgreSQL is running: `pg_isready`
- Verify DATABASE_URL in backend/.env
- Ensure database exists: `createdb linkedin_followup`

### "Email send failed"
- Use Gmail app password, not regular password
- Enable 2-factor authentication first
- Check EMAIL_USER and EMAIL_PASSWORD in .env
- Restart backend after changing .env

### "Extension not syncing"
- Verify you're on linkedin.com/jobs page
- Check API token is correct in extension options
- Inspect extension console: right-click icon → Inspect popup
- Ensure backend is accessible

### Port already in use
```bash
# Find and kill process on port 3000
# macOS/Linux:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

## Next Steps

1. Customize your email template (Dashboard → Email Template)
2. Configure auto-send settings (Dashboard → Settings)
3. Set up rate limits based on your needs
4. Review sent emails in Dashboard → Email Logs

## Production Deployment

For production deployment, see the main README.md file for:
- Environment variable configuration
- Database hosting setup
- Frontend deployment (Vercel/Netlify)
- Backend deployment (Railway/Heroku/AWS)
- Chrome Web Store submission

## Getting Help

- Check console logs in browser (F12)
- Check backend logs in terminal
- Verify all environment variables are set
- Ensure all services are running
- Review API-DOCUMENTATION.md for endpoint details

## Quick Commands Reference

```bash
# Start backend (from backend/)
npm run dev

# Start frontend (from frontend/)
npm run dev

# Check database tables
psql linkedin_followup -c "\dt"

# View backend logs
cd backend && npm run dev

# Build for production
cd backend && npm run build
cd frontend && npm run build

# Run database migrations
cd backend && npm run migrate
```

## Default Credentials

First user created becomes the account owner. No default credentials exist.

## Security Notes

- Change JWT_SECRET to a random 32+ character string
- Never commit .env files
- Use app-specific passwords for email
- Keep API tokens secure
- Enable HTTPS in production
- Configure CORS properly for production domains

## Performance Tips

- PostgreSQL connection pooling is configured (max 20 connections)
- Rate limiting prevents abuse (100 req/15min)
- Email sending is throttled (configurable)
- Resume files stored on disk (consider S3 for production)
- Frontend uses SSR for better performance

## File Locations

- Database: PostgreSQL data directory
- Uploads: `backend/uploads/` (configurable via UPLOAD_DIR)
- Logs: Console output (configure file logging for production)
- Config: `backend/.env` and `frontend/.env.local`

Happy job hunting! 🎯
