# Outreach - Simple Cold Email Tool

A clean, simple outreach tool that helps you find the right people, generate personalized emails, and send them through your own email account.

## ✨ Features

### 🎯 Choose Your Purpose
Select one of three outreach types:
- **Job Referral** - Ask for referrals at target companies (attaches resume)
- **Personal Website** - Offer to build/improve their website (attaches portfolio)
- **Automation** - Offer to automate their workflows (attaches case study)

### 🔍 Find People
- Enter company name and optional website
- Filter by title keywords and seniority
- Auto-generate email addresses

### 📧 Preview & Edit
- See exactly what each person will receive
- Edit subject and body inline
- Review attachments

### 📤 Send Through Your Account
- Use your own SMTP (Gmail, etc.)
- Rate-limited sending (10-20/hour)
- No external dependencies

## 🖥️ Simple 4-Screen Flow

1. **Purpose** → Choose job referral, website, or automation
2. **Company** → Enter target company and filters
3. **Review** → Preview emails, edit if needed
4. **History** → See past campaigns

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React, TypeScript |
| Backend | Node.js, Express, TypeScript |
| Database | SQLite |
| Email | Nodemailer (SMTP) |

## 📁 Project Structure

```
outreach/
├── backend/
│   ├── src/
│   │   ├── index.ts          # Express server
│   │   ├── routes/           # API endpoints
│   │   └── services/         # Discovery, email
│   └── package.json
│
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── page.tsx      # Main wizard (4 steps)
│       │   ├── history/      # Past campaigns
│       │   └── settings/     # Profile & SMTP
│       ├── components/
│       └── styles/
│
└── package.json
```

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/aayushdivase333-lab/hire_ai.git
cd hire_ai

# Install
npm install

# Configure backend (optional - for actual email sending)
cp backend/.env.example backend/.env
# Edit .env with SMTP credentials

# Run
npm run dev
```

**Open:** http://localhost:3000

## ⚙️ Settings

### Profile (Required)
- Full name
- Role/title
- LinkedIn URL
- Portfolio URL

### SMTP (For Sending)
- Gmail: `smtp.gmail.com`, port `587`
- Use App Password (not your main password)
- Go to: Google Account → Security → 2-Step Verification → App passwords

### Attachments
- Upload your resume (PDF)
- Upload your portfolio (PDF)
- Auto-attached based on purpose

## 📋 Email Templates

### Job Referral
```
Subject: Quick question about {{company_name}}

Hi {{first_name}},

I came across your profile and noticed you're a {{role}} at {{company_name}}...
[asks for referral or short chat]
[mentions resume attached]
```

### Personal Website
```
Subject: Your online presence, {{first_name}}

Hi {{first_name}},

I help professionals create strong personal websites...
[emphasizes online credibility]
[links portfolio]
```

### Automation
```
Subject: Automating the boring stuff at {{company_name}}

Hi {{first_name}},

As a {{role}}, you probably deal with repetitive work...
[offers to automate workflows]
[links portfolio]
```

## 🔒 Privacy

- All data stored locally in browser (localStorage)
- No external servers
- Emails sent directly through your SMTP
- CAN-SPAM compliant opt-out in every email

## 📝 License

MIT - Use freely

---

**Simple workflow. Right people. Personalized emails.**
