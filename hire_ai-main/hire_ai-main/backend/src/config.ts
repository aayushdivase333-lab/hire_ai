import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
    // Server
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',

    // Database
    databasePath: process.env.DATABASE_PATH || './data/leadfinder.db',

    // Encryption
    encryptionKey: process.env.ENCRYPTION_KEY || '',

    // SMTP
    smtp: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
        fromName: process.env.SMTP_FROM_NAME || 'Lead Finder',
        fromEmail: process.env.SMTP_FROM_EMAIL || '',
    },

    // Redis (optional)
    redisUrl: process.env.REDIS_URL,

    // Rate Limiting
    maxEmailsPerHour: parseInt(process.env.MAX_EMAILS_PER_HOUR || '15', 10),
    maxEmailsPerDay: parseInt(process.env.MAX_EMAILS_PER_DAY || '100', 10),
    delayBetweenEmailsMs: parseInt(process.env.DELAY_BETWEEN_EMAILS_MS || '180000', 10),

    // Discovery
    maxResultsPerSearch: parseInt(process.env.MAX_RESULTS_PER_SEARCH || '15', 10),
    searchDelayMs: parseInt(process.env.SEARCH_DELAY_MS || '2000', 10),

    // Your Identity
    myName: process.env.MY_NAME || 'Your Name',
    myEmail: process.env.MY_EMAIL || '',
    myServiceSummary: process.env.MY_SERVICE_SUMMARY ||
        'I help small investment teams and family offices launch or fix their sites, dashboards, and automations so deal work runs smoother.',

    // Privacy
    dataRetentionDays: parseInt(process.env.DATA_RETENTION_DAYS || '365', 10),
};

// Validate required config
export function validateConfig(): void {
    const required = [
        { key: 'ENCRYPTION_KEY', value: config.encryptionKey },
    ];

    const missing = required.filter(r => !r.value);

    if (missing.length > 0 && config.nodeEnv === 'production') {
        throw new Error(`Missing required environment variables: ${missing.map(m => m.key).join(', ')}`);
    }

    if (!config.encryptionKey) {
        console.warn('⚠️  ENCRYPTION_KEY not set. Using insecure default for development.');
    }
}
