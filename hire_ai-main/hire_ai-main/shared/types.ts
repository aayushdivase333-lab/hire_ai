/**
 * Shared TypeScript types for Lead Finder application
 * Used by both backend and frontend
 */

// ============================================
// Database Entity Types
// ============================================

export interface Company {
  id: string;
  name: string;
  domain: string | null;
  website_url: string | null;
  industry: string | null;
  size: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Person {
  id: string;
  company_id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  title: string | null;
  location: string | null;
  linkedin_url: string | null;
  seniority_tag: SeniorityLevel | null;
  source: string;
  source_details: string | null;
  is_verified: boolean;
  do_not_contact: boolean;
  created_at: string;
  updated_at: string;
}

export interface Email {
  id: string;
  person_id: string;
  email: string;
  confidence_level: ConfidenceLevel;
  validation_status: ValidationStatus;
  validation_details: string | null;
  is_primary: boolean;
  last_checked_at: string | null;
  created_at: string;
}

export interface OutreachMessage {
  id: string;
  person_id: string;
  company_id: string;
  email_used: string;
  subject: string;
  body: string;
  template_name: string;
  sequence_number: number;
  scheduled_at: string | null;
  sent_at: string | null;
  status: OutreachStatus;
  opens: number;
  replies: number;
  unsubscribe_flag: boolean;
  bounce_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  template_type: TemplateType;
  offer_type: OfferType;
  sequence_position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UnsubscribeRecord {
  id: string;
  email: string;
  domain: string | null;
  unsubscribed_at: string;
  source: string;
}

// ============================================
// Enums and Constants
// ============================================

export type SeniorityLevel = 
  | 'c_level'
  | 'partner'
  | 'vp'
  | 'director'
  | 'manager'
  | 'analyst'
  | 'associate'
  | 'other';

export type ConfidenceLevel = 
  | 'high'
  | 'medium'
  | 'low'
  | 'unknown';

export type ValidationStatus = 
  | 'pending'
  | 'valid'
  | 'invalid'
  | 'risky'
  | 'catch_all'
  | 'unknown';

export type OutreachStatus = 
  | 'draft'
  | 'queued'
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'replied'
  | 'bounced'
  | 'failed'
  | 'do_not_contact';

export type TemplateType = 
  | 'first_touch'
  | 'follow_up_1'
  | 'follow_up_2'
  | 'custom';

export type OfferType = 
  | 'website_support'
  | 'automation_dashboards'
  | 'custom';

export const SENIORITY_KEYWORDS: Record<SeniorityLevel, string[]> = {
  c_level: ['CEO', 'CFO', 'CIO', 'CTO', 'COO', 'Chief', 'Founder', 'Co-Founder'],
  partner: ['Managing Partner', 'Partner', 'General Partner', 'Senior Partner'],
  vp: ['Vice President', 'VP', 'SVP', 'EVP'],
  director: ['Director', 'Managing Director', 'MD'],
  manager: ['Manager', 'Head of', 'Lead'],
  analyst: ['Analyst', 'Senior Analyst', 'Investment Analyst'],
  associate: ['Associate', 'Investment Associate', 'Principal'],
  other: []
};

export const ROLE_KEYWORDS = [
  'Managing Partner',
  'Principal',
  'Investment Associate',
  'CIO',
  'Chief Investment Officer',
  'Operations',
  'Chief of Staff',
  'Portfolio Manager',
  'Wealth Manager',
  'Family Office Director',
  'CFO',
  'COO'
];

// ============================================
// API Request/Response Types
// ============================================

export interface SearchFilters {
  roles?: string[];
  geography?: string[];
  seniority?: SeniorityLevel[];
  maxContacts?: number;
}

export interface CompanySearchRequest {
  companyName: string;
  companyWebsite?: string;
  filters?: SearchFilters;
}

export interface DiscoveryResult {
  company: Company;
  people: PersonWithEmails[];
  searchMetadata: {
    queriesUsed: string[];
    sourcesChecked: string[];
    totalFound: number;
    filteredCount: number;
    timestamp: string;
  };
}

export interface PersonWithEmails extends Person {
  emails: Email[];
  company?: Company;
}

export interface OutreachRequest {
  personIds: string[];
  templateId: string;
  customVariables?: Record<string, string>;
  scheduleAt?: string;
}

export interface EmailGenerationRequest {
  personId: string;
  templateType: TemplateType;
  offerType: OfferType;
  customContext?: string;
}

export interface EmailPreview {
  subject: string;
  body: string;
  variables: Record<string, string>;
}

// ============================================
// Email Template Variables
// ============================================

export interface TemplateVariables {
  first_name: string;
  last_name: string;
  full_name: string;
  company_name: string;
  role: string;
  my_name: string;
  my_service_summary: string;
  opt_out_text: string;
}

export const DEFAULT_VARIABLES: Partial<TemplateVariables> = {
  my_name: 'Your Name',
  my_service_summary: 'I help small investment teams and family offices launch or fix their sites, dashboards, and automations so deal work runs smoother.',
  opt_out_text: 'If this is not relevant, reply with "no" and I will remove you.'
};

// ============================================
// Job Queue Types
// ============================================

export interface DiscoveryJob {
  id: string;
  type: 'company_discovery' | 'email_discovery' | 'email_validation';
  payload: Record<string, unknown>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  result?: unknown;
  error?: string;
  created_at: string;
  completed_at?: string;
}

export interface EmailJob {
  id: string;
  outreachMessageId: string;
  personId: string;
  email: string;
  subject: string;
  body: string;
  scheduledAt: string;
  attempts: number;
  maxAttempts: number;
}

// ============================================
// Settings and Configuration
// ============================================

export interface AppSettings {
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    fromName: string;
    fromEmail: string;
  };
  outreach: {
    maxEmailsPerHour: number;
    maxEmailsPerDay: number;
    delayBetweenEmails: number; // milliseconds
    followUpDelayDays: number;
  };
  discovery: {
    maxResultsPerSearch: number;
    searchDelayMs: number;
    userAgent: string;
  };
  privacy: {
    encryptionEnabled: boolean;
    dataRetentionDays: number;
  };
}

// ============================================
// API Response Wrappers
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
