# LeadGen - Privacy-First Lead Finder & Cold Email System

A sophisticated, privacy-respecting lead finder and cold email sender built for boutique firms and family offices. Find contacts, generate emails, and send personalized outreach - all while staying 100% legal and ToS-compliant.

![LeadGen Dashboard](./docs/dashboard.png)

## ✨ Features

### 🎯 One-Click Discovery
- Enter a company name → System finds 10-15 relevant contacts automatically
- Select target roles (Partner, C-Level, Director, VP, etc.)
- Review and approve before adding contacts

### 📧 Smart Email Generation
- Auto-generate email addresses based on common patterns
- MX record validation to verify domain exists
- Multiple candidates ranked by confidence

### 📝 Template System
- Customizable email templates with variables
- Variables: `{{first_name}}`, `{{company_name}}`, `{{role}}`, `{{my_service_summary}}`
- Preview with sample data before sending

### 📤 Outreach Management
- Queue emails with rate limiting (CAN-SPAM compliant)
- Track status: Draft → Queued → Sent → Replied
- Mark replies, cancel pending, view history

### 📎 Document Attachments
- Upload portfolios, case studies, rate cards
- Attach to outreach emails automatically

### 👤 Profile Management
- Store your info for email personalization
- Configure services you offer
- Custom email signature

### 🔒 Privacy & Compliance
- **GDPR Compliant**: Delete data on request
- **CAN-SPAM Compliant**: Opt-out in every email
- **AES-256 Encryption**: Emails encrypted at rest
- **ToS Compliant**: No LinkedIn scraping/automation

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React, TypeScript |
| Backend | Node.js, Express, TypeScript |
| Database | SQLite (better-sqlite3) |
| Email | Nodemailer (SMTP) |
| Styling | Custom CSS (Dark theme) |
| Encryption | CryptoJS (AES-256) |

## 📁 Project Structure

```
leadgen/
├── package.json              # Monorepo root
├── README.md
├── .gitignore
│
├── backend/
│   ├── .env.example          # Environment template
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts          # Express server
│   │   ├── config.ts         # Configuration
│   │   ├── db/
│   │   │   ├── database.ts   # SQLite schema
│   │   │   ├── migrate.ts    # Migrations
│   │   │   └── seed.ts       # Default templates
│   │   ├── routes/
│   │   │   ├── companies.ts
│   │   │   ├── people.ts
│   │   │   ├── templates.ts
│   │   │   ├── outreach.ts
│   │   │   ├── discovery.ts
│   │   │   └── system.ts
│   │   ├── services/
│   │   │   ├── discovery.ts
│   │   │   ├── emailDiscovery.ts
│   │   │   ├── emailSender.ts
│   │   │   └── queue.ts
│   │   └── utils/
│   │       └── encryption.ts
│   └── tests/
│
├── frontend/
│   ├── .env.example
│   ├── package.json
│   ├── next.config.js
│   ├── tsconfig.json
│   └── src/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx          # Dashboard
│       │   ├── discover/         # Lead discovery
│       │   ├── companies/        # Company management
│       │   ├── contacts/         # Contact management
│       │   ├── templates/        # Email templates
│       │   ├── outreach/         # Campaign sender
│       │   ├── documents/        # File attachments
│       │   ├── profile/          # Your profile
│       │   └── settings/         # System settings
│       ├── components/
│       ├── lib/
│       └── styles/
│
└── shared/
    └── types.ts              # Shared TypeScript types
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ with npm
- SMTP credentials (Gmail, SendGrid, etc.)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/leadgen.git
cd leadgen

# Install dependencies
npm install

# Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your SMTP credentials

# Initialize database
npm run migrate

# Seed default templates
npm run seed

# Start development servers
npm run dev
```

### Access
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

## ⚙️ Configuration

### Backend Environment Variables

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_PATH=./data/leadfinder.db

# Encryption (generate a secure 32+ char key)
ENCRYPTION_KEY=your-super-secret-key-minimum-32-chars

# SMTP (example: Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=your-email@gmail.com
FROM_NAME=Your Name

# Rate Limiting
HOURLY_EMAIL_LIMIT=15
DAILY_EMAIL_LIMIT=100
MIN_EMAIL_DELAY_MS=180000

# Your Identity (for templates)
MY_NAME=Your Name
MY_EMAIL=your-email@gmail.com
MY_SERVICE_SUMMARY=I help firms modernize their digital presence.

# Data Retention
DATA_RETENTION_DAYS=90
```

## 📋 Workflow

1. **Add Company** → Enter name + website
2. **Discover Contacts** → Select roles, system finds people
3. **Generate Emails** → Auto-create email addresses
4. **Choose Template** → Personalized with variables
5. **Send Outreach** → Rate-limited, compliant
6. **Track Results** → Monitor replies, follow up

## 🔐 Security Features

| Feature | Implementation |
|---------|----------------|
| Email encryption | AES-256 at rest |
| Unsubscribe tracking | SHA-256 email hash |
| Rate limiting | Per-hour/day limits |
| Request throttling | Express rate-limit |
| CORS protection | Configurable origins |
| SQL injection | Parameterized queries |

## 📈 API Endpoints

### Companies
- `GET /api/companies` - List companies
- `POST /api/companies` - Create company
- `DELETE /api/companies/:id` - Delete company

### People
- `GET /api/people` - List contacts
- `POST /api/people` - Create contact
- `POST /api/people/:id/generate-emails` - Generate emails

### Discovery
- `POST /api/discovery/auto` - Auto-discover contacts
- `GET /api/discovery/suggestions` - Get search queries

### Outreach
- `GET /api/outreach` - List messages
- `POST /api/outreach` - Create message
- `POST /api/outreach/bulk` - Bulk send
- `POST /api/outreach/:id/send` - Send now

### Templates
- `GET /api/templates` - List templates
- `POST /api/templates` - Create template
- `POST /api/templates/:id/preview` - Preview with variables

## 🧪 Testing

```bash
# Run backend tests
cd backend
npm test

# Run with coverage
npm run test:coverage
```

## 📄 License

MIT License - feel free to use for your own lead generation needs.

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines.

---

**Built with ❤️ for boutique firms and solo entrepreneurs**
