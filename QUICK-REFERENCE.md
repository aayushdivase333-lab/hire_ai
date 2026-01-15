# Quick Reference Card

## 🚀 Quick Start Commands

```bash
# One-time setup
npm run install:all        # Install all dependencies
npm run db:setup           # Create database and tables

# Development
npm run dev                # Start both backend and frontend
npm run dev:backend        # Start backend only (port 3000)
npm run dev:frontend       # Start frontend only (port 3001)

# Production
npm run build              # Build both projects
npm run start              # Start both in production mode
```

## 🌐 URLs

- **Frontend:** http://localhost:3001
- **Backend API:** http://localhost:3000/api/v1
- **Health Check:** http://localhost:3000/health
- **API Docs:** See API-DOCUMENTATION.md

## 🔑 Environment Variables

### Backend (.env)
```bash
# Required
DATABASE_URL=postgresql://user:pass@localhost:5432/linkedin_followup
JWT_SECRET=your-secret-key-min-32-chars
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password

# Optional (has defaults)
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3001
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

## 📊 Database

```bash
# Connect to database
psql linkedin_followup

# Common queries
\dt                                    # List tables
\d users                              # Describe users table
SELECT * FROM users;                  # View users
SELECT * FROM job_applications LIMIT 5;  # View applications
```

## 🔐 Authentication

### JWT (Web App)
```javascript
// In browser console
localStorage.getItem('auth_token')    // View token
localStorage.removeItem('auth_token') // Logout
```

### API Token (Extension)
```javascript
// In extension console
chrome.storage.sync.get(['apiToken'], (data) => {
  console.log(data.apiToken);
});
```

## 📧 Email Template Placeholders

```
{{recruiter_name}}     - Recruiter or hiring manager name
{{company_name}}       - Company name
{{job_title}}          - Job position title
{{job_location}}       - Job location
{{application_id}}     - Application reference ID
{{application_date}}   - Formatted application date
{{job_link}}           - LinkedIn job URL
{{candidate_name}}     - Your full name
{{candidate_email}}    - Your preferred email
{{candidate_phone}}    - Your phone number
```

## 🛠️ Troubleshooting

### Backend won't start
```bash
# Check PostgreSQL
pg_isready

# Check port 3000
lsof -ti:3000            # macOS/Linux
netstat -ano | findstr :3000  # Windows

# View logs
cd backend && npm run dev
```

### Frontend won't start
```bash
# Check port 3001
lsof -ti:3001            # macOS/Linux

# Clear cache
rm -rf frontend/.next
cd frontend && npm run dev
```

### Database connection failed
```bash
# Check DATABASE_URL in backend/.env
# Verify database exists
psql -l | grep linkedin_followup

# Recreate if needed
npm run db:reset
```

### Email sending failed
```bash
# Verify Gmail app password (not regular password)
# Check EMAIL_USER and EMAIL_PASSWORD in .env
# Ensure 2FA is enabled on Google account
# Restart backend after .env changes
```

### Extension not working
```bash
# Check API token in extension options
# Verify backend is running
# Check extension console for errors
# Reload extension at chrome://extensions/
```

## 📦 Project Structure

```
hire ai/
├── backend/          # Node.js API
├── frontend/         # Next.js web app
├── chrome-extension/ # Chrome extension
├── *.md             # Documentation
└── database-schema.sql
```

## 🎯 Common Tasks

### Create new user
```bash
# Use web UI: http://localhost:3001/signup
# Or via API:
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "full_name": "John Doe",
    "preferred_email": "john@example.com"
  }'
```

### Upload resume via curl
```bash
curl -X POST http://localhost:3000/api/v1/resume/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/resume.pdf"
```

### Sync applications via API
```bash
curl -X POST http://localhost:3000/api/v1/applications/sync \
  -H "Content-Type: application/json" \
  -H "X-API-Token: YOUR_API_TOKEN" \
  -d '{
    "applications": [{
      "job_title": "Software Engineer",
      "company_name": "Tech Corp",
      "location": "San Francisco, CA",
      "application_date": "2025-01-14",
      "linkedin_application_id": "linkedin_123456"
    }]
  }'
```

### Send emails via API
```bash
curl -X POST http://localhost:3000/api/v1/emails/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "application_ids": ["uuid1", "uuid2"]
  }'
```

## 🔍 Debugging

### View backend logs
```bash
cd backend
npm run dev
# All requests logged to console
```

### View database queries
```bash
# Set LOG_LEVEL=debug in backend/.env
# Query logs appear in console
```

### Test email connection
```bash
# In backend/src/services/email.service.ts
# Call emailService.verifyConnection()
# Or check at startup
```

### Inspect extension
```bash
# Right-click extension icon → Inspect popup
# Check console for errors
# View network requests
```

## 📈 Default Limits

- **File Upload:** 5MB (resume)
- **Emails per day:** 10 (configurable)
- **Email rate limit:** 5 minutes (configurable)
- **API rate limit:** 100 requests per 15 minutes
- **JWT expiration:** 7 days
- **Database connections:** 20 max

## 🎨 Status Values

### Application Status
- `pending` - Ready to send email
- `email_sent` - Email successfully sent
- `failed` - Email sending failed
- `no_contact_found` - No recruiter email
- `manual_review` - Needs manual review

### Email Log Status
- `queued` - Waiting to send
- `sent` - Successfully sent
- `failed` - Send failed

## 🔒 Security Checklist

- [ ] Changed JWT_SECRET from default
- [ ] Using Gmail app password (not regular password)
- [ ] CORS configured for production domain
- [ ] HTTPS enabled in production
- [ ] Database password is strong
- [ ] .env files not committed to git
- [ ] API tokens kept secure
- [ ] File uploads validated

## 📚 Documentation Files

- `README.md` - Complete documentation
- `API-DOCUMENTATION.md` - All API endpoints
- `SETUP-GUIDE.md` - Quick setup (10 min)
- `ARCHITECTURE.md` - System architecture
- `WORKFLOWS.md` - User workflows
- `PROJECT-SUMMARY.md` - Project overview
- `QUICK-REFERENCE.md` - This file

## 🆘 Getting Help

1. Check console logs
2. Review relevant documentation
3. Verify environment variables
4. Check service status
5. Review error messages
6. Check GitHub issues

## 💡 Tips

- **Sync regularly** - LinkedIn data changes
- **Keep resume updated** - Replace when you update CV
- **Customize templates** - Better response rates
- **Monitor logs** - Catch failures early
- **Use filters** - Manage applications efficiently
- **Test emails** - Send to yourself first
- **Business hours** - Send during work hours
- **Professional tone** - Keep emails formal

## 🎓 Learning Resources

**TypeScript:** https://www.typescriptlang.org/docs/
**Next.js:** https://nextjs.org/docs
**Express:** https://expressjs.com/
**PostgreSQL:** https://www.postgresql.org/docs/
**Chrome Extensions:** https://developer.chrome.com/docs/extensions/

## 📞 Support

- GitHub Issues: [repository-url]/issues
- Email: support@example.com
- Documentation: See /docs folder

## 🗺️ Roadmap

**v1.0** (Current)
- ✅ Core functionality
- ✅ Chrome extension
- ✅ Email sending
- ✅ Dashboard

**v1.1** (Future)
- [ ] Auto-sync on page load
- [ ] Email open tracking
- [ ] Response analytics
- [ ] Multiple resumes

**v2.0** (Future)
- [ ] Mobile app
- [ ] AI suggestions
- [ ] More job platforms
- [ ] Team features

---

**Version:** 1.0.0
**Last Updated:** 2025-01-14
**Status:** Production Ready ✅
