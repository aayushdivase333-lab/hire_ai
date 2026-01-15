# System Architecture

## High-Level Architecture

```
┌─────────────────┐
│   User Browser  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐  ┌──────────────┐
│ Web App│  │   Chrome     │
│(Next.js)│  │  Extension   │
└───┬────┘  └──────┬───────┘
    │              │
    │  REST API    │
    └──────┬───────┘
           ▼
    ┌──────────────┐
    │   Backend    │
    │  (Node.js)   │
    └──┬─────┬─────┘
       │     │
       ▼     ▼
   ┌────┐ ┌────────┐
   │ DB │ │ Email  │
   │    │ │Service │
   └────┘ └────────┘
```

## Component Details

### 1. Frontend Web Application (Next.js)

**Location:** `/frontend`

**Responsibilities:**
- User authentication (signup/login)
- Dashboard for viewing applications
- Email template customization
- Resume upload and management
- Settings configuration
- Application filtering and selection
- Email sending interface

**Technology Stack:**
- Next.js 14 (React framework)
- TypeScript
- Tailwind CSS
- Zustand (state management)
- Axios (API client)

**Key Pages:**
- `/` - Landing page
- `/login` - Authentication
- `/signup` - Registration
- `/dashboard` - Main dashboard
- `/dashboard/email-template` - Template editor
- `/dashboard/resume` - Resume management
- `/dashboard/linkedin-setup` - Extension setup
- `/dashboard/settings` - User settings

**State Management:**
```typescript
AuthStore
├── user: User | null
├── token: string | null
├── isAuthenticated: boolean
└── methods: login, logout, setUser
```

### 2. Backend API (Node.js + Express)

**Location:** `/backend`

**Responsibilities:**
- RESTful API endpoints
- Authentication and authorization
- Database operations
- Email sending
- File upload handling
- Rate limiting
- Input validation

**Technology Stack:**
- Node.js 20+
- Express.js
- TypeScript
- PostgreSQL (pg driver)
- JWT for authentication
- Nodemailer for emails
- Multer for file uploads
- Bcrypt for password hashing

**Service Layer:**
```
EmailService
├── sendEmail()
├── generateEmailContent()
├── buildPlaceholders()
└── verifyConnection()
```

**Middleware Stack:**
```
Request Flow:
1. CORS middleware
2. Helmet security headers
3. Rate limiting
4. Body parsing
5. Request logging
6. Route handlers
7. Validation middleware
8. Authentication middleware
9. Controller logic
10. Response
11. Error handler
```

### 3. Chrome Extension

**Location:** `/chrome-extension`

**Responsibilities:**
- Extract job application data from LinkedIn
- Sync data with backend API
- Provide quick access to sync operations
- Store API token securely

**Components:**

**Content Script (`content.js`):**
- Runs on linkedin.com/jobs pages
- Extracts job data from DOM
- Detects recruiter information
- Sends data to background script

**Background Script (`background.js`):**
- Service worker for extension
- Handles API communication
- Manages sync operations
- Updates extension badge

**Popup (`popup.html/js`):**
- Quick sync interface
- Status display
- Link to dashboard

**Options (`options.html/js`):**
- API token configuration
- Connection testing
- Settings management

**Data Flow:**
```
LinkedIn Page
    ↓ (DOM extraction)
Content Script
    ↓ (message passing)
Background Script
    ↓ (HTTP POST)
Backend API
    ↓ (store)
Database
```

### 4. Database (PostgreSQL)

**Location:** Database server

**Schema Structure:**

```
users
├── id (PK)
├── email (unique)
├── password_hash
├── full_name
├── api_token (unique)
└── timestamps

resumes
├── id (PK)
├── user_id (FK → users)
├── file_path
├── is_active
└── timestamps

email_templates
├── id (PK)
├── user_id (FK → users)
├── subject_template
├── body_template
└── timestamps

job_applications
├── id (PK)
├── user_id (FK → users)
├── job_title
├── company_name
├── recruiter_email
├── status
├── linkedin_application_id (unique)
└── timestamps

email_logs
├── id (PK)
├── user_id (FK → users)
├── job_application_id (FK → job_applications)
├── recipient_email
├── status
└── timestamps

user_settings
├── id (PK)
├── user_id (FK → users)
├── auto_send_enabled
├── max_emails_per_day
└── timestamps
```

**Indexes:**
- user_id on all related tables
- status on job_applications
- linkedin_application_id (unique)
- api_token (unique)
- email on users (unique)

### 5. Email Service

**Integration:** Nodemailer with SMTP

**Flow:**
```
1. Get application data
2. Load user profile
3. Load email template
4. Build placeholders
5. Fill template
6. Attach resume PDF
7. Send via SMTP
8. Log result
9. Update application status
```

**Configuration:**
- SMTP host/port
- Authentication credentials
- From address/name
- TLS/SSL settings

**Email Structure:**
```
From: User Name <user@email.com>
To: recruiter@company.com
Subject: [Filled template]
Body: [Filled template]
Attachments:
  - resume.pdf
```

## Data Flow

### Application Sync Flow

```
1. User opens LinkedIn jobs page
2. Chrome extension detects page
3. User clicks "Sync" button
4. Content script extracts data:
   - Job title
   - Company name
   - Location
   - Application date
   - Recruiter info
   - Job link
5. Extension sends to backend API
6. Backend validates data
7. Backend checks for duplicates (linkedin_application_id)
8. Backend inserts/updates database
9. Backend returns sync results
10. Extension shows success message
11. User sees applications in dashboard
```

### Email Sending Flow

```
1. User selects applications in dashboard
2. User clicks "Send Emails"
3. Frontend sends POST to /emails/send
4. Backend checks rate limits
5. Backend loads user profile
6. Backend loads email template
7. For each application:
   a. Check recruiter email exists
   b. Build email placeholders
   c. Fill template
   d. Load resume file
   e. Send email via SMTP
   f. Create email log
   g. Update application status
8. Backend returns results
9. Frontend shows success/failure
10. Dashboard refreshes
```

## Authentication Flow

### Web App Authentication (JWT)

```
1. User enters credentials
2. Backend validates
3. Backend generates JWT token
4. Token stored in localStorage
5. Token sent in Authorization header
6. Backend verifies JWT on each request
7. Token expires after 7 days
8. User logs out → token deleted
```

### Extension Authentication (API Token)

```
1. User logs into web app
2. Web app displays API token
3. User copies token
4. User pastes in extension options
5. Extension stores in chrome.storage.sync
6. Extension sends token in X-API-Token header
7. Backend validates token
8. Backend identifies user
```

## Security Architecture

### Authentication
- JWT with 7-day expiration
- Bcrypt password hashing (10 rounds)
- API tokens (32 bytes, hex encoded)
- Secure token storage

### Authorization
- User can only access own resources
- User ID checked on all operations
- Foreign key constraints in database

### Input Validation
- Joi schema validation
- File type checking (PDF only)
- File size limits (5MB)
- SQL injection prevention (parameterized queries)
- XSS prevention (input sanitization)

### API Security
- Rate limiting (100 req/15min)
- CORS configuration
- Helmet security headers
- HTTPS in production
- No sensitive data in URLs

### Data Protection
- Passwords never stored plaintext
- API tokens encrypted at rest
- Resume files access-controlled
- Email logs contain no passwords

## Scaling Considerations

### Database
- Connection pooling (20 connections)
- Indexes on frequently queried fields
- Pagination on list endpoints
- Soft deletes for data retention

### API
- Stateless design (JWT)
- Horizontal scaling possible
- Load balancer compatible
- Rate limiting per user

### File Storage
- Local disk for development
- S3/Cloud Storage for production
- CDN for resume downloads
- Cleanup of old files

### Email
- Queue system for high volume
- Retry logic for failures
- Rate limiting (10/day default)
- Batch operations

## Deployment Architecture

### Development
```
localhost:3000 ← Backend
localhost:3001 ← Frontend
localhost:5432 ← PostgreSQL
```

### Production
```
api.yourdomain.com ← Backend (Railway/Heroku)
app.yourdomain.com ← Frontend (Vercel)
db.cloud.com       ← PostgreSQL (Managed)
smtp.gmail.com     ← Email (Gmail)
```

## Error Handling

### Backend
- Global error handler
- Specific error types
- Detailed logging
- User-friendly messages

### Frontend
- Try-catch blocks
- Error boundaries
- Toast notifications
- Fallback UI

### Extension
- Console logging
- User notifications
- Retry mechanisms
- Graceful degradation

## Monitoring and Logging

### Backend Logs
- Request/response logging
- Error logging
- Database query logging
- Email sending logs

### Frontend Logs
- Error tracking
- User actions
- API failures
- Performance metrics

### Database Logs
- Query performance
- Connection issues
- Failed transactions

## Performance Optimizations

### Backend
- Database connection pooling
- Efficient queries with indexes
- Pagination for large datasets
- Caching headers

### Frontend
- Next.js SSR
- Code splitting
- Image optimization
- Lazy loading

### Database
- Proper indexing
- Query optimization
- Materialized views (future)
- Partitioning (if needed)

## Future Enhancements

1. **Caching Layer:** Redis for session storage
2. **Queue System:** Bull/Bee-Queue for email jobs
3. **Analytics:** Track open rates, response rates
4. **Webhooks:** Email event tracking
5. **API Gateway:** Kong/NGINX for routing
6. **Microservices:** Separate email service
7. **Real-time:** WebSockets for live updates
8. **Mobile App:** React Native companion

## Technology Choices Rationale

**Next.js:** SSR, routing, great DX, production-ready
**PostgreSQL:** Relational data, ACID compliance, mature
**Node.js:** JavaScript everywhere, async I/O, huge ecosystem
**TypeScript:** Type safety, better DX, fewer bugs
**JWT:** Stateless, scalable, standard
**Nodemailer:** Reliable, well-maintained, flexible

## Constraints and Limitations

- Email daily limit (configurable, default 10)
- Resume file size (5MB max)
- Chrome extension only (no Firefox)
- LinkedIn page structure may change
- SMTP rate limits apply
- Single resume per user currently
- No real-time sync (manual trigger)

## Dependencies

### Backend
- express: Web framework
- pg: PostgreSQL client
- jsonwebtoken: JWT handling
- bcrypt: Password hashing
- nodemailer: Email sending
- multer: File uploads
- joi: Validation

### Frontend
- next: React framework
- react: UI library
- zustand: State management
- axios: HTTP client
- tailwindcss: Styling

### Extension
- No external dependencies
- Uses Chrome APIs natively
