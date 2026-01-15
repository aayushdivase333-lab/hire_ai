# API Documentation

Base URL: `/api/v1`

All authenticated endpoints require `Authorization: Bearer <token>` header.

---

## Authentication Endpoints

### POST /auth/signup
Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "full_name": "John Doe",
  "preferred_email": "john@example.com",
  "phone_number": "+1234567890",
  "linkedin_profile_url": "https://linkedin.com/in/johndoe"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "preferred_email": "john@example.com",
    "phone_number": "+1234567890",
    "linkedin_profile_url": "https://linkedin.com/in/johndoe",
    "api_token": "generated_api_token",
    "created_at": "2025-01-14T10:00:00Z"
  },
  "token": "jwt_token"
}
```

### POST /auth/login
Authenticate and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:** `200 OK`
```json
{
  "user": { ... },
  "token": "jwt_token"
}
```

### POST /auth/refresh
Refresh JWT token.

**Response:** `200 OK`
```json
{
  "token": "new_jwt_token"
}
```

### GET /auth/me
Get current user profile.

**Response:** `200 OK`
```json
{
  "user": { ... }
}
```

---

## Profile Endpoints

### PUT /profile
Update user profile information.

**Request Body:**
```json
{
  "full_name": "John Doe Updated",
  "phone_number": "+1234567890",
  "linkedin_profile_url": "https://linkedin.com/in/johndoe",
  "preferred_email": "newemail@example.com"
}
```

**Response:** `200 OK`
```json
{
  "user": { ... }
}
```

### GET /profile/api-token
Get or regenerate API token for Chrome extension.

**Query Parameters:**
- `regenerate` (optional): boolean

**Response:** `200 OK`
```json
{
  "api_token": "token_string"
}
```

---

## Resume Endpoints

### POST /resume/upload
Upload resume file (PDF).

**Request:** `multipart/form-data`
- `file`: Resume PDF file (max 5MB)

**Response:** `201 Created`
```json
{
  "resume": {
    "id": "uuid",
    "user_id": "uuid",
    "file_name": "resume.pdf",
    "file_size": 245680,
    "uploaded_at": "2025-01-14T10:00:00Z",
    "is_active": true
  }
}
```

### GET /resume
Get current active resume details.

**Response:** `200 OK`
```json
{
  "resume": {
    "id": "uuid",
    "file_name": "resume.pdf",
    "file_size": 245680,
    "uploaded_at": "2025-01-14T10:00:00Z"
  }
}
```

### GET /resume/download
Download resume file.

**Response:** `200 OK`
- Content-Type: application/pdf
- Binary file data

### DELETE /resume/:id
Delete a resume file.

**Response:** `204 No Content`

---

## Email Template Endpoints

### GET /email-template
Get current email template.

**Response:** `200 OK`
```json
{
  "template": {
    "id": "uuid",
    "subject_template": "Application for {{job_title}} at {{company_name}}",
    "body_template": "Dear {{recruiter_name}},\n\nI hope you are well...",
    "created_at": "2025-01-14T10:00:00Z",
    "updated_at": "2025-01-14T10:00:00Z"
  }
}
```

### PUT /email-template
Update email template.

**Request Body:**
```json
{
  "subject_template": "Application for {{job_title}} at {{company_name}}",
  "body_template": "Dear {{recruiter_name}}..."
}
```

**Response:** `200 OK`
```json
{
  "template": { ... }
}
```

### POST /email-template/preview
Preview email with sample data.

**Request Body:**
```json
{
  "subject_template": "Application for {{job_title}} at {{company_name}}",
  "body_template": "Dear {{recruiter_name}}...",
  "sample_data": {
    "recruiter_name": "Jane Smith",
    "company_name": "Tech Corp",
    "job_title": "Software Engineer",
    "job_location": "San Francisco, CA",
    "application_id": "APP-12345",
    "application_date": "2025-01-10",
    "job_link": "https://linkedin.com/jobs/123",
    "candidate_name": "John Doe",
    "candidate_email": "john@example.com",
    "candidate_phone": "+1234567890"
  }
}
```

**Response:** `200 OK`
```json
{
  "subject": "Application for Software Engineer at Tech Corp",
  "body": "Dear Jane Smith,\n\nI hope you are well. I recently applied for the Software Engineer position at Tech Corp..."
}
```

---

## Job Applications Endpoints

### GET /applications
List all job applications with filters.

**Query Parameters:**
- `company` (optional): Filter by company name
- `status` (optional): Filter by status (pending, email_sent, failed, no_contact_found, manual_review)
- `date_from` (optional): Filter by application date (YYYY-MM-DD)
- `date_to` (optional): Filter by application date (YYYY-MM-DD)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "job_title": "Software Engineer",
      "company_name": "Tech Corp",
      "location": "San Francisco, CA",
      "application_date": "2025-01-10",
      "application_id": "APP-12345",
      "job_link": "https://linkedin.com/jobs/123",
      "recruiter_name": "Jane Smith",
      "recruiter_email": "jane@techcorp.com",
      "status": "pending",
      "created_at": "2025-01-14T10:00:00Z",
      "updated_at": "2025-01-14T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

### GET /applications/:id
Get single application details.

**Response:** `200 OK`
```json
{
  "application": {
    "id": "uuid",
    "job_title": "Software Engineer",
    "company_name": "Tech Corp",
    "location": "San Francisco, CA",
    "application_date": "2025-01-10",
    "application_id": "APP-12345",
    "job_link": "https://linkedin.com/jobs/123",
    "job_description": "Full job description text...",
    "recruiter_name": "Jane Smith",
    "recruiter_email": "jane@techcorp.com",
    "status": "pending",
    "raw_data": { ... },
    "created_at": "2025-01-14T10:00:00Z",
    "updated_at": "2025-01-14T10:00:00Z"
  },
  "email_logs": [
    {
      "id": "uuid",
      "recipient_email": "jane@techcorp.com",
      "subject": "Application for Software Engineer at Tech Corp",
      "status": "sent",
      "sent_at": "2025-01-14T11:00:00Z"
    }
  ]
}
```

### POST /applications/sync
Sync applications from LinkedIn (called by Chrome extension).

**Request Body:**
```json
{
  "applications": [
    {
      "job_title": "Software Engineer",
      "company_name": "Tech Corp",
      "location": "San Francisco, CA",
      "application_date": "2025-01-10",
      "application_id": "APP-12345",
      "job_link": "https://linkedin.com/jobs/123",
      "job_description": "Full description...",
      "recruiter_name": "Jane Smith",
      "recruiter_email": "jane@techcorp.com",
      "linkedin_application_id": "linkedin_unique_id",
      "raw_data": { ... }
    }
  ]
}
```

**Response:** `200 OK`
```json
{
  "sync_id": "uuid",
  "applications_found": 5,
  "applications_new": 2,
  "applications_updated": 3,
  "status": "completed"
}
```

### PUT /applications/:id
Update application details manually.

**Request Body:**
```json
{
  "recruiter_name": "Jane Smith Updated",
  "recruiter_email": "jane.updated@techcorp.com",
  "status": "manual_review"
}
```

**Response:** `200 OK`
```json
{
  "application": { ... }
}
```

### DELETE /applications/:id
Delete an application.

**Response:** `204 No Content`

---

## Email Sending Endpoints

### POST /emails/send
Send follow-up emails for selected applications.

**Request Body:**
```json
{
  "application_ids": ["uuid1", "uuid2", "uuid3"],
  "force": false
}
```

**Response:** `200 OK`
```json
{
  "queued": 3,
  "sent": 2,
  "failed": 1,
  "results": [
    {
      "application_id": "uuid1",
      "status": "sent",
      "email_log_id": "uuid"
    },
    {
      "application_id": "uuid2",
      "status": "sent",
      "email_log_id": "uuid"
    },
    {
      "application_id": "uuid3",
      "status": "failed",
      "error": "No recruiter email found"
    }
  ]
}
```

### POST /emails/send/:application_id
Send or resend email for a single application.

**Response:** `200 OK`
```json
{
  "status": "sent",
  "email_log_id": "uuid"
}
```

### GET /emails/logs
Get email sending history.

**Query Parameters:**
- `application_id` (optional): Filter by application
- `status` (optional): Filter by status (queued, sent, failed)
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "job_application_id": "uuid",
      "job_title": "Software Engineer",
      "company_name": "Tech Corp",
      "recipient_email": "jane@techcorp.com",
      "subject": "Application for Software Engineer at Tech Corp",
      "status": "sent",
      "sent_at": "2025-01-14T11:00:00Z",
      "created_at": "2025-01-14T10:55:00Z"
    }
  ],
  "pagination": { ... }
}
```

---

## Settings Endpoints

### GET /settings
Get user settings.

**Response:** `200 OK`
```json
{
  "settings": {
    "auto_send_enabled": false,
    "require_manual_approval": true,
    "max_emails_per_day": 10,
    "email_rate_limit_minutes": 5
  }
}
```

### PUT /settings
Update user settings.

**Request Body:**
```json
{
  "auto_send_enabled": true,
  "require_manual_approval": false,
  "max_emails_per_day": 15,
  "email_rate_limit_minutes": 10
}
```

**Response:** `200 OK`
```json
{
  "settings": { ... }
}
```

---

## Dashboard Endpoints

### GET /dashboard/stats
Get dashboard statistics.

**Response:** `200 OK`
```json
{
  "total_applications": 45,
  "emails_sent": 28,
  "pending": 12,
  "failed": 3,
  "no_contact_found": 2,
  "last_sync_at": "2025-01-14T10:00:00Z"
}
```

### GET /dashboard/sync-history
Get synchronization history.

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "sync_started_at": "2025-01-14T10:00:00Z",
      "sync_completed_at": "2025-01-14T10:02:00Z",
      "applications_found": 5,
      "applications_new": 2,
      "status": "completed"
    }
  ],
  "pagination": { ... }
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": {
    "email": "Invalid email format"
  }
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "You don't have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "error": "Not found",
  "message": "Resource not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded",
  "message": "Maximum emails per day reached",
  "retry_after": 86400
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```
