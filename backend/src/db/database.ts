import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { config } from '../config.js';

// Ensure data directory exists
const dbDir = path.dirname(config.databasePath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(config.databasePath);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Database schema
export const schema = `
-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT,
  website_url TEXT,
  industry TEXT,
  size TEXT,
  location TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_domain ON companies(domain);

-- People table
CREATE TABLE IF NOT EXISTS people (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  title TEXT,
  location TEXT,
  linkedin_url TEXT,
  seniority_tag TEXT,
  source TEXT NOT NULL,
  source_details TEXT,
  is_verified INTEGER NOT NULL DEFAULT 0,
  do_not_contact INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_people_company ON people(company_id);
CREATE INDEX IF NOT EXISTS idx_people_name ON people(full_name);
CREATE INDEX IF NOT EXISTS idx_people_seniority ON people(seniority_tag);

-- Emails table (encrypted at rest)
CREATE TABLE IF NOT EXISTS emails (
  id TEXT PRIMARY KEY,
  person_id TEXT NOT NULL,
  email_encrypted TEXT NOT NULL,
  email_hash TEXT NOT NULL,
  confidence_level TEXT NOT NULL DEFAULT 'unknown',
  validation_status TEXT NOT NULL DEFAULT 'pending',
  validation_details TEXT,
  is_primary INTEGER NOT NULL DEFAULT 0,
  last_checked_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_emails_person ON emails(person_id);
CREATE INDEX IF NOT EXISTS idx_emails_hash ON emails(email_hash);
CREATE UNIQUE INDEX IF NOT EXISTS idx_emails_unique ON emails(person_id, email_hash);

-- Outreach messages table
CREATE TABLE IF NOT EXISTS outreach_messages (
  id TEXT PRIMARY KEY,
  person_id TEXT NOT NULL,
  company_id TEXT NOT NULL,
  email_used_encrypted TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  template_name TEXT NOT NULL,
  sequence_number INTEGER NOT NULL DEFAULT 1,
  scheduled_at TEXT,
  sent_at TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  opens INTEGER NOT NULL DEFAULT 0,
  replies INTEGER NOT NULL DEFAULT 0,
  unsubscribe_flag INTEGER NOT NULL DEFAULT 0,
  bounce_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_outreach_person ON outreach_messages(person_id);
CREATE INDEX IF NOT EXISTS idx_outreach_status ON outreach_messages(status);
CREATE INDEX IF NOT EXISTS idx_outreach_scheduled ON outreach_messages(scheduled_at);

-- Email templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  template_type TEXT NOT NULL,
  offer_type TEXT NOT NULL,
  sequence_position INTEGER NOT NULL DEFAULT 1,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Unsubscribe records table
CREATE TABLE IF NOT EXISTS unsubscribe_records (
  id TEXT PRIMARY KEY,
  email_hash TEXT NOT NULL UNIQUE,
  domain TEXT,
  unsubscribed_at TEXT NOT NULL DEFAULT (datetime('now')),
  source TEXT NOT NULL DEFAULT 'user_request'
);

CREATE INDEX IF NOT EXISTS idx_unsub_hash ON unsubscribe_records(email_hash);
CREATE INDEX IF NOT EXISTS idx_unsub_domain ON unsubscribe_records(domain);

-- Discovery jobs table
CREATE TABLE IF NOT EXISTS discovery_jobs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  progress INTEGER NOT NULL DEFAULT 0,
  result TEXT,
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON discovery_jobs(status);

-- Audit log for compliance
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
`;

export function initializeDatabase(): void {
    db.exec(schema);
    console.log('✅ Database schema initialized');
}
