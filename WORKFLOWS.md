# System Workflows

This document describes the key workflows and user journeys through the system.

## Workflow 1: Initial Setup

```
User Journey: New user sets up their account

1. Landing Page
   └─> Click "Get Started"

2. Signup Page
   ├─> Enter email, password, full name
   ├─> Enter preferred email for sending
   ├─> Enter phone number (optional)
   ├─> Enter LinkedIn profile URL (optional)
   └─> Click "Create Account"

3. Backend Processing
   ├─> Validate input
   ├─> Hash password
   ├─> Generate API token
   ├─> Create user record
   ├─> Create default email template
   ├─> Create user settings
   └─> Generate JWT token

4. Auto-redirect to Dashboard
   └─> Show welcome message
   └─> Display setup checklist

Time: ~2 minutes
```

## Workflow 2: Resume Upload

```
User Journey: Upload resume for email attachments

1. Dashboard Navigation
   └─> Click "Resume" in navigation

2. Resume Page
   ├─> Click "Choose File"
   ├─> Select PDF file (max 5MB)
   └─> Click "Upload"

3. Backend Processing
   ├─> Validate file type (PDF only)
   ├─> Validate file size (≤ 5MB)
   ├─> Generate unique filename
   ├─> Save to uploads directory
   ├─> Deactivate old resumes
   ├─> Create resume record in database
   └─> Return success

4. UI Update
   ├─> Show success message
   ├─> Display file name
   ├─> Display file size
   ├─> Display upload date
   └─> Show "Download" button

Time: ~30 seconds
```

## Workflow 3: Email Template Customization

```
User Journey: Customize email template for follow-ups

1. Dashboard Navigation
   └─> Click "Email Template"

2. Email Template Page
   ├─> View default template
   ├─> See available placeholders list
   └─> Edit subject line
   └─> Edit email body

3. Preview Feature
   ├─> Enter sample data
   ├─> Click "Preview"
   ├─> View filled template
   └─> Adjust as needed

4. Save Template
   ├─> Click "Save Template"
   └─> Backend validates
   └─> Updates database
   └─> Returns success

5. UI Confirmation
   └─> Show success message
   └─> Template ready for use

Time: ~3 minutes
```

## Workflow 4: Chrome Extension Setup

```
User Journey: Install and configure extension

1. Web Dashboard
   ├─> Navigate to "LinkedIn Setup"
   ├─> Read instructions
   └─> Copy API token (displayed)

2. Chrome Browser
   ├─> Go to chrome://extensions/
   ├─> Enable "Developer mode"
   ├─> Click "Load unpacked"
   ├─> Select chrome-extension folder
   └─> Extension appears in toolbar

3. Extension Configuration
   ├─> Right-click extension icon
   ├─> Click "Options"
   ├─> Paste API token
   ├─> Click "Test Connection"
   ├─> Verify success message
   └─> Click "Save Settings"

4. Verification
   ├─> Extension icon active
   ├─> Badge ready
   └─> Ready to sync

Time: ~2 minutes
```

## Workflow 5: Sync LinkedIn Applications

```
User Journey: Extract applications from LinkedIn

1. Navigate to LinkedIn
   └─> Go to linkedin.com/jobs
   └─> View your applied jobs

2. Extension Detection
   ├─> Content script loads
   ├─> Detects jobs page
   └─> Sets badge notification (!)

3. Trigger Sync
   ├─> Click extension icon
   ├─> See popup
   └─> Click "Sync LinkedIn Applications"

4. Data Extraction (Content Script)
   ├─> Find all job cards on page
   ├─> For each job card:
   │   ├─> Extract job title
   │   ├─> Extract company name
   │   ├─> Extract location
   │   ├─> Extract application date
   │   ├─> Extract job link
   │   ├─> Extract recruiter info (if available)
   │   └─> Build application object
   └─> Collect all applications

5. Send to Backend
   ├─> Background script receives data
   ├─> POST /applications/sync
   ├─> Include X-API-Token header
   └─> Send applications array

6. Backend Processing
   ├─> Validate API token
   ├─> Create sync history record
   ├─> For each application:
   │   ├─> Check if exists (linkedin_application_id)
   │   ├─> If new: INSERT
   │   ├─> If existing: UPDATE
   │   └─> Set status based on recruiter email
   ├─> Update sync history
   └─> Return results

7. User Feedback
   ├─> Extension shows success
   ├─> Display: "5 applications synced (2 new)"
   ├─> Clear badge
   └─> Update last sync time

8. Dashboard Update
   └─> User refreshes dashboard
   └─> Sees new applications

Time: ~30 seconds
Data: Typically 5-20 applications per sync
```

## Workflow 6: Send Follow-up Emails

```
User Journey: Send emails to selected recruiters

1. Dashboard View
   ├─> See list of applications
   ├─> Filter by status: "pending"
   └─> View applications with recruiter emails

2. Selection
   ├─> Click checkboxes for desired applications
   │   or
   └─> Click "Select All" to choose all

3. Pre-send Checks
   └─> Button shows: "Send Emails (3)"
   └─> Click "Send Emails"

4. Backend Validation
   ├─> Check user settings
   ├─> Verify rate limits:
   │   ├─> Max emails per day not exceeded
   │   └─> Time between emails respected
   ├─> Verify resume exists
   └─> Load email template

5. Email Generation (for each application)
   ├─> Load application details
   ├─> Check recruiter_email exists
   ├─> Build placeholders:
   │   ├─> recruiter_name
   │   ├─> company_name
   │   ├─> job_title
   │   ├─> job_location
   │   ├─> application_id
   │   ├─> application_date (formatted)
   │   ├─> job_link
   │   ├─> candidate_name
   │   ├─> candidate_email
   │   └─> candidate_phone
   ├─> Fill template subject
   ├─> Fill template body
   └─> Prepare resume attachment

6. Email Sending (SMTP)
   ├─> Configure Nodemailer transport
   ├─> Set From: candidate email
   ├─> Set To: recruiter email
   ├─> Set Subject: filled template
   ├─> Set Body: filled template (text + HTML)
   ├─> Attach resume PDF
   ├─> Send via SMTP
   └─> Capture result

7. Logging
   ├─> Create email_log record:
   │   ├─> job_application_id
   │   ├─> recipient_email
   │   ├─> subject
   │   ├─> body
   │   ├─> status (sent/failed)
   │   ├─> error_message (if failed)
   │   └─> sent_at timestamp
   └─> Update application status:
       ├─> "email_sent" if successful
       └─> "failed" if unsuccessful

8. Results Summary
   ├─> Return to frontend:
   │   ├─> sent: 2
   │   ├─> failed: 1
   │   └─> results array
   └─> Frontend shows:
       ├─> Success message
       ├─> Individual results
       └─> Updated dashboard

9. Email Delivery
   ├─> SMTP server processes
   ├─> Email reaches recruiter inbox
   └─> Resume attached and viewable

Time: ~10 seconds for 3 emails
Success Rate: Typically >95%
```

## Workflow 7: Review Email Logs

```
User Journey: Check sent email history

1. Dashboard Navigation
   └─> Click "Email Logs" or view in app table

2. Email Logs View
   ├─> See table of all sent emails
   ├─> Columns:
   │   ├─> Job title
   │   ├─> Company
   │   ├─> Recruiter email
   │   ├─> Status (sent/failed)
   │   ├─> Sent date/time
   │   └─> Actions
   └─> Filter options:
       ├─> By status
       ├─> By date range
       └─> By application

3. View Details
   ├─> Click on email row
   ├─> See full email content:
   │   ├─> Subject line
   │   ├─> Email body
   │   ├─> Recipient
   │   ├─> Status
   │   └─> Error message (if failed)
   └─> Option to resend if failed

Time: ~1 minute
```

## Workflow 8: Manual Application Update

```
User Journey: Update recruiter email manually

1. Dashboard
   └─> Find application with "No Contact Found"

2. View Application
   ├─> Click application row
   └─> See details page

3. Edit Mode
   ├─> Click "Edit" button
   ├─> Fields become editable:
   │   ├─> Recruiter name
   │   └─> Recruiter email
   └─> Enter correct email

4. Save Changes
   ├─> Click "Save"
   ├─> Backend validates email format
   ├─> Updates database
   ├─> Changes status to "pending"
   └─> Returns success

5. Send Email
   └─> Now available for email sending

Time: ~1 minute per application
```

## Workflow 9: Settings Configuration

```
User Journey: Configure email sending preferences

1. Dashboard Navigation
   └─> Click "Settings"

2. Settings Page
   ├─> Auto-send toggle
   │   ├─> Enable/disable automatic sending
   │   └─> Warning shown if enabled
   ├─> Manual approval toggle
   │   └─> Require approval before sending
   ├─> Max emails per day
   │   ├─> Slider (1-100)
   │   └─> Default: 10
   └─> Email rate limit
       ├─> Minutes between emails (1-60)
       └─> Default: 5

3. Save Settings
   ├─> Click "Save Settings"
   ├─> Backend validates
   ├─> Updates user_settings table
   └─> Returns success

4. Confirmation
   └─> Settings applied to future sends

Time: ~2 minutes
```

## Workflow 10: Profile Update

```
User Journey: Update profile information

1. Dashboard
   └─> Click profile icon or "Profile"

2. Profile Page
   ├─> Current information displayed
   ├─> Editable fields:
   │   ├─> Full name
   │   ├─> Phone number
   │   ├─> LinkedIn profile URL
   │   └─> Preferred email
   └─> Non-editable:
       └─> Login email

3. Make Changes
   ├─> Update desired fields
   └─> Click "Save Changes"

4. Backend Processing
   ├─> Validate inputs
   ├─> Update users table
   └─> Return updated user

5. Confirmation
   ├─> Show success message
   └─> Update displayed name in UI

Time: ~1 minute
```

## Error Handling Workflows

### When Email Sending Fails

```
1. Backend detects failure
   └─> Captures error message

2. Create log record
   ├─> status: "failed"
   ├─> error_message: detailed error
   └─> sent_at: NULL

3. Update application
   └─> status: "failed"

4. Return to frontend
   └─> Show specific error

5. User options:
   ├─> Review error message
   ├─> Update recruiter email if invalid
   ├─> Check email settings
   └─> Retry sending
```

### When Extension Sync Fails

```
1. Content script error
   └─> Log to console

2. Background script catches
   └─> Show error in popup

3. User sees:
   ├─> Clear error message
   ├─> Suggestions:
   │   ├─> Check LinkedIn page
   │   ├─> Verify API token
   │   └─> Check internet connection
   └─> Retry button
```

### When Rate Limit Exceeded

```
1. Backend checks daily limit
   └─> 10 emails already sent today

2. Return 429 error
   ├─> error: "Rate limit exceeded"
   ├─> message: "Max 10 emails per day"
   └─> retry_after: seconds until midnight

3. Frontend shows:
   ├─> Clear message
   ├─> Current limit
   ├─> Time until reset
   └─> Link to settings to increase
```

## Data Flow Summary

```
LinkedIn Page
    ↓ (Extract)
Chrome Extension Content Script
    ↓ (Message)
Chrome Extension Background Worker
    ↓ (POST /applications/sync)
Backend API
    ↓ (INSERT/UPDATE)
PostgreSQL Database
    ↓ (Query)
Dashboard Frontend
    ↓ (User selects)
Email Sending Flow
    ↓ (Generate)
Email with Resume
    ↓ (SMTP)
Recruiter Inbox
```

## Performance Metrics

**Sync Operation:**
- Page detection: < 100ms
- Data extraction: 200-500ms (depends on job count)
- API sync: 500-2000ms (depends on job count)
- Total: < 3 seconds for 10 applications

**Email Sending:**
- Template generation: < 50ms per email
- SMTP send: 500-2000ms per email
- Logging: < 100ms per email
- Total: ~2-3 seconds per email

**Page Loads:**
- Landing page: < 500ms
- Dashboard: < 1 second (with data)
- API response: < 200ms average

## Concurrent User Support

The system supports multiple concurrent users:
- Each user has isolated data
- Database connection pooling (20 connections)
- Rate limiting per user
- JWT tokens for stateless auth
- No shared state between users

## Workflow Optimization Tips

1. **Batch sync**: Scroll through all LinkedIn job pages before syncing
2. **Filter effectively**: Use status filters to focus on pending applications
3. **Update manually**: Add recruiter emails for "No Contact Found" applications
4. **Schedule sends**: Send emails during business hours for better response rates
5. **Monitor logs**: Check email logs regularly for failures
6. **Keep resume updated**: Replace resume when you update your CV
7. **Customize template**: Personalize for better response rates
8. **Use filters**: Filter by company or date to manage applications better
