# LinkedIn Job Application Follow-up System

A production-ready full-stack application that automates follow-up emails for LinkedIn job applications. Built with Node.js, React, Next.js, PostgreSQL, and Chrome Extensions.

## Overview

This system helps job seekers follow up on their LinkedIn applications by:
- Automatically fetching job applications from LinkedIn via Chrome extension
- Storing application details and recruiter contact information
- Sending professional follow-up emails with resume attachments
- Tracking email delivery and managing application status

## Architecture

### Backend (Node.js + Express + PostgreSQL)
- RESTful API with JWT authentication
- PostgreSQL database with comprehensive data models
- Email service with Nodemailer
- File upload handling for resume PDFs
- Rate limiting and security middleware

### Frontend (Next.js + React + TypeScript)
- Server-side rendered React application
- Zustand for state management
- Tailwind CSS for styling
- Dashboard for managing applications
- Email template customization
- Resume upload and management

### Chrome Extension
- Content script to extract LinkedIn application data
- Background service worker for sync operations
- Popup UI for quick sync actions
- Options page for configuration

## Project Structure

```
hire ai/
├── backend/                    # Backend API
│   ├── src/
│   │   ├── config/            # Database and configuration
│   │   ├── controllers/       # API controllers
│   │   ├── middleware/        # Auth, validation middleware
│   │   ├── models/            # TypeScript type definitions
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic (email service)
│   │   ├── utils/             # Helper functions
│   │   └── server.ts          # Main server file
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/                   # Frontend web app
│   ├── src/
│   │   ├── app/               # Next.js pages
│   │   ├── components/        # React components
│   │   ├── lib/               # API client and utilities
│   │   └── store/             # Zustand stores
│   ├── package.json
│   ├── tsconfig.json
│   └── next.config.js
│
├── chrome-extension/          # Chrome extension
│   ├── manifest.json
│   ├── content.js             # Content script for LinkedIn
│   ├── background.js          # Background service worker
│   ├── popup.html/js          # Extension popup
│   └── options.html/js        # Extension settings
│
├── database-schema.sql        # PostgreSQL database schema
├── API-DOCUMENTATION.md       # Complete API documentation
└── README.md                  # This file
```

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Chrome browser (for extension)
- Email account (Gmail recommended for SMTP)

## Installation

### 1. Database Setup

```bash
# Create PostgreSQL database
createdb linkedin_followup

# Run the schema
psql linkedin_followup < database-schema.sql
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# Required: DATABASE_URL, JWT_SECRET, EMAIL credentials
nano .env

# Build TypeScript
npm run build

# Start development server
npm run dev
```

Backend runs on http://localhost:3000

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on http://localhost:3001

### 4. Chrome Extension Setup

```bash
# Open Chrome and go to: chrome://extensions/
# Enable "Developer mode"
# Click "Load unpacked"
# Select the chrome-extension/ directory
```

## Configuration

### Backend Environment Variables

Edit `backend/.env`:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/linkedin_followup

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Email Configuration (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM_ADDRESS=your-email@gmail.com

# Server
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3001
```

### Email Setup (Gmail)

1. Enable 2-factor authentication on your Google account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the app password in EMAIL_PASSWORD (not your regular password)

### Chrome Extension Configuration

1. Create an account on the web app
2. Navigate to Dashboard → LinkedIn Setup
3. Copy your API token
4. Open extension options (right-click extension icon → Options)
5. Paste API token and save

## Usage

### User Flow

1. **Sign Up**
   - Visit http://localhost:3001
   - Create an account with email and password
   - Fill in profile details (name, phone, LinkedIn URL)

2. **Upload Resume**
   - Navigate to Dashboard → Resume
   - Upload PDF resume (max 5MB)

3. **Configure Email Template**
   - Navigate to Dashboard → Email Template
   - Customize subject and body with placeholders
   - Preview with sample data

4. **Install Chrome Extension**
   - Load extension in Chrome
   - Configure API token in extension options

5. **Sync LinkedIn Applications**
   - Visit LinkedIn jobs page (linkedin.com/jobs)
   - Click extension icon
   - Click "Sync LinkedIn Applications"

6. **Send Follow-up Emails**
   - Review applications in Dashboard
   - Select applications to follow up
   - Click "Send Emails"
   - Monitor status and logs

### Email Template Placeholders

Available placeholders for email customization:

- `{{recruiter_name}}` - Recruiter or hiring manager name
- `{{company_name}}` - Company name
- `{{job_title}}` - Job position title
- `{{job_location}}` - Job location
- `{{application_id}}` - Application reference ID
- `{{application_date}}` - Date of application
- `{{job_link}}` - LinkedIn job posting URL
- `{{candidate_name}}` - Your full name
- `{{candidate_email}}` - Your preferred email
- `{{candidate_phone}}` - Your phone number

## API Documentation

See [API-DOCUMENTATION.md](./API-DOCUMENTATION.md) for complete API reference.

Base URL: `http://localhost:3000/api/v1`

### Key Endpoints

- `POST /auth/signup` - Create account
- `POST /auth/login` - Login
- `GET /applications` - List applications
- `POST /applications/sync` - Sync from LinkedIn
- `POST /emails/send` - Send follow-up emails
- `POST /resume/upload` - Upload resume
- `PUT /email-template` - Update email template

## Security Features

- JWT authentication with secure token storage
- API token authentication for Chrome extension
- Password hashing with bcrypt
- SQL injection prevention with parameterized queries
- Input validation with Joi
- Rate limiting on API endpoints
- CORS protection
- Helmet security headers
- File upload validation (PDF only, max 5MB)

## Rate Limiting

Default limits:
- API: 100 requests per 15 minutes
- Emails: 10 per day (configurable per user)
- Email rate: 1 every 5 minutes (configurable)

## Development

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Database Migrations

```bash
cd backend
npm run migrate
```

### Building for Production

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm start
```

## Deployment

### Backend Deployment

1. Set up PostgreSQL database on hosting provider
2. Configure environment variables
3. Deploy to platform (Heroku, Railway, AWS, etc.)
4. Run database migrations

### Frontend Deployment

1. Update `NEXT_PUBLIC_API_URL` environment variable
2. Deploy to Vercel, Netlify, or similar
3. Configure custom domain if needed

### Chrome Extension Publishing

1. Create developer account on Chrome Web Store
2. Package extension as .zip
3. Upload and submit for review
4. Update manifest.json with production API URL

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `pg_isready`
- Check DATABASE_URL in .env
- Ensure database exists: `psql -l`

### Email Sending Failures
- Verify SMTP credentials
- Check Gmail app password (not regular password)
- Ensure "Less secure app access" is enabled if not using app password
- Check firewall/network settings for SMTP port

### Chrome Extension Not Working
- Verify API token is correct
- Check extension has LinkedIn permissions
- Inspect background service worker console for errors
- Ensure backend API is accessible

### CORS Errors
- Verify CORS_ORIGIN in backend .env matches frontend URL
- Check browser console for specific CORS errors

## File Size Limits

- Resume PDF: 5MB maximum
- Email attachments: 10MB total
- API request body: 10MB

## Browser Support

- Chrome/Edge: Full support
- Firefox: Not supported (Chrome extension only)
- Safari: Not supported

## Technology Stack

**Backend:**
- Node.js 20+
- Express.js
- TypeScript
- PostgreSQL
- Nodemailer
- JWT
- Bcrypt
- Multer

**Frontend:**
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Zustand
- Axios

**Chrome Extension:**
- Manifest V3
- Vanilla JavaScript
- Chrome Storage API

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: [repository]/issues
- Email: support@example.com

## Roadmap

Future enhancements:
- Multiple resume versions
- A/B testing email templates
- Analytics dashboard
- Recruiter contact database
- Email scheduling
- Follow-up reminders
- Integration with other job platforms
- Mobile app

## Version

Current version: 1.0.0

## Authors

Built as a production-ready system for automating LinkedIn job application follow-ups.
