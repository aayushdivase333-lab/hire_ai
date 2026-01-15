// TypeScript type definitions for all data models

export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  phone_number?: string;
  linkedin_profile_url?: string;
  preferred_email: string;
  api_token: string;
  auto_send_enabled: boolean;
  created_at: Date;
  updated_at: Date;
  last_login_at?: Date;
}

export interface Resume {
  id: string;
  user_id: string;
  file_name: string;
  file_size: number;
  file_path: string;
  mime_type: string;
  uploaded_at: Date;
  is_active: boolean;
}

export interface EmailTemplate {
  id: string;
  user_id: string;
  subject_template: string;
  body_template: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export type ApplicationStatus =
  | 'pending'
  | 'email_sent'
  | 'failed'
  | 'no_contact_found'
  | 'manual_review';

export interface JobApplication {
  id: string;
  user_id: string;
  job_title: string;
  company_name: string;
  location?: string;
  application_date: Date;
  application_id?: string;
  job_link?: string;
  job_description?: string;
  recruiter_name?: string;
  recruiter_email?: string;
  status: ApplicationStatus;
  linkedin_application_id?: string;
  raw_data?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export type EmailLogStatus = 'queued' | 'sent' | 'failed';

export interface EmailLog {
  id: string;
  user_id: string;
  job_application_id: string;
  recipient_email: string;
  subject: string;
  body: string;
  status: EmailLogStatus;
  error_message?: string;
  sent_at?: Date;
  created_at: Date;
}

export interface UserSettings {
  id: string;
  user_id: string;
  auto_send_enabled: boolean;
  require_manual_approval: boolean;
  max_emails_per_day: number;
  email_rate_limit_minutes: number;
  created_at: Date;
  updated_at: Date;
}

export type SyncStatus = 'in_progress' | 'completed' | 'failed';

export interface SyncHistory {
  id: string;
  user_id: string;
  sync_started_at: Date;
  sync_completed_at?: Date;
  applications_found: number;
  applications_new: number;
  status: SyncStatus;
  error_message?: string;
  created_at: Date;
}

// DTOs for API requests and responses

export interface SignupRequest {
  email: string;
  password: string;
  full_name: string;
  preferred_email: string;
  phone_number?: string;
  linkedin_profile_url?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'password_hash'>;
  token: string;
}

export interface UpdateProfileRequest {
  full_name?: string;
  phone_number?: string;
  linkedin_profile_url?: string;
  preferred_email?: string;
}

export interface UpdateEmailTemplateRequest {
  subject_template: string;
  body_template: string;
}

export interface LinkedInApplicationData {
  job_title: string;
  company_name: string;
  location?: string;
  application_date: string;
  application_id?: string;
  job_link?: string;
  job_description?: string;
  recruiter_name?: string;
  recruiter_email?: string;
  linkedin_application_id?: string;
  raw_data?: Record<string, any>;
}

export interface SyncApplicationsRequest {
  applications: LinkedInApplicationData[];
}

export interface SendEmailRequest {
  application_ids: string[];
  force?: boolean;
}

export interface ApplicationFilters {
  company?: string;
  status?: ApplicationStatus;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface DashboardStats {
  total_applications: number;
  emails_sent: number;
  pending: number;
  failed: number;
  no_contact_found: number;
  last_sync_at?: Date;
}

export interface EmailPlaceholders {
  recruiter_name: string;
  company_name: string;
  job_title: string;
  job_location: string;
  application_id: string;
  application_date: string;
  job_link: string;
  candidate_name: string;
  candidate_email: string;
  candidate_phone: string;
}
