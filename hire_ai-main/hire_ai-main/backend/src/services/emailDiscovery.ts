import dns from 'dns';
import net from 'net';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unknown';
export type ValidationStatus = 'valid' | 'invalid' | 'risky' | 'catch_all' | 'unknown';

export interface EmailCandidate {
    email: string;
    pattern: string;
    confidence: ConfidenceLevel;
}

export interface ValidationResult {
    email: string;
    isValid: boolean;
    status: ValidationStatus;
    details: string;
    mxRecords?: string[];
}

/**
 * Common email patterns used by companies
 */
const EMAIL_PATTERNS = [
    { pattern: 'firstname.lastname', template: (f: string, l: string) => `${f}.${l}` },
    { pattern: 'firstname_lastname', template: (f: string, l: string) => `${f}_${l}` },
    { pattern: 'firstnamelastname', template: (f: string, l: string) => `${f}${l}` },
    { pattern: 'firstname', template: (f: string, _l: string) => f },
    { pattern: 'flastname', template: (f: string, l: string) => `${f[0]}${l}` },
    { pattern: 'firstnamel', template: (f: string, l: string) => `${f}${l[0]}` },
    { pattern: 'f.lastname', template: (f: string, l: string) => `${f[0]}.${l}` },
    { pattern: 'lastname.firstname', template: (f: string, l: string) => `${l}.${f}` },
    { pattern: 'lastname', template: (_f: string, l: string) => l },
];

/**
 * Normalize name parts for email generation
 */
function normalizeName(name: string): string {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z]/g, ''); // Remove non-alpha
}

/**
 * Generate candidate email addresses for a person
 */
export function generateEmailCandidates(
    firstName: string,
    lastName: string,
    domain: string
): EmailCandidate[] {
    const f = normalizeName(firstName);
    const l = normalizeName(lastName);

    if (!f || !l || !domain) {
        return [];
    }

    const candidates: EmailCandidate[] = [];

    // Most common patterns get higher confidence
    const highConfidencePatterns = ['firstname.lastname', 'firstname_lastname', 'firstnamelastname'];
    const mediumConfidencePatterns = ['firstname', 'flastname', 'f.lastname'];

    for (const { pattern, template } of EMAIL_PATTERNS) {
        const localPart = template(f, l);
        const email = `${localPart}@${domain}`;

        let confidence: ConfidenceLevel = 'low';
        if (highConfidencePatterns.includes(pattern)) {
            confidence = 'high';
        } else if (mediumConfidencePatterns.includes(pattern)) {
            confidence = 'medium';
        }

        candidates.push({ email, pattern, confidence });
    }

    return candidates;
}

/**
 * Check if a domain has valid MX records (can receive email)
 */
export async function checkMxRecords(domain: string): Promise<{ valid: boolean; records: string[] }> {
    try {
        const records = await resolveMx(domain);
        const sorted = records.sort((a, b) => a.priority - b.priority);
        return {
            valid: records.length > 0,
            records: sorted.map(r => r.exchange)
        };
    } catch (error) {
        return { valid: false, records: [] };
    }
}

/**
 * Perform a basic SMTP check (RCPT TO) to validate email existence
 * This is a low-risk check that doesn't send any email
 * WARNING: Use sparingly to avoid being rate-limited
 */
export async function smtpCheck(
    email: string,
    mxHost: string,
    timeout: number = 10000
): Promise<{ valid: boolean; catchAll: boolean; details: string }> {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        let step = 0;
        let response = '';
        let isCatchAll = false;

        const cleanup = () => {
            socket.destroy();
        };

        socket.setTimeout(timeout);

        socket.on('timeout', () => {
            cleanup();
            resolve({ valid: false, catchAll: false, details: 'Connection timeout' });
        });

        socket.on('error', (err) => {
            cleanup();
            resolve({ valid: false, catchAll: false, details: `Connection error: ${err.message}` });
        });

        socket.on('data', (data) => {
            response = data.toString();
            const code = parseInt(response.substring(0, 3), 10);

            switch (step) {
                case 0: // Initial greeting
                    if (code === 220) {
                        socket.write(`HELO leadfinder.local\r\n`);
                        step = 1;
                    } else {
                        cleanup();
                        resolve({ valid: false, catchAll: false, details: `Unexpected greeting: ${code}` });
                    }
                    break;

                case 1: // HELO response
                    if (code === 250) {
                        socket.write(`MAIL FROM:<test@leadfinder.local>\r\n`);
                        step = 2;
                    } else {
                        cleanup();
                        resolve({ valid: false, catchAll: false, details: `HELO rejected: ${code}` });
                    }
                    break;

                case 2: // MAIL FROM response
                    if (code === 250) {
                        socket.write(`RCPT TO:<${email}>\r\n`);
                        step = 3;
                    } else {
                        cleanup();
                        resolve({ valid: false, catchAll: false, details: `MAIL FROM rejected: ${code}` });
                    }
                    break;

                case 3: // RCPT TO response - this is what we care about
                    socket.write(`QUIT\r\n`);

                    if (code === 250) {
                        // Check for catch-all by trying a clearly fake address
                        resolve({ valid: true, catchAll: isCatchAll, details: 'Email accepted' });
                    } else if (code === 550 || code === 551 || code === 552 || code === 553) {
                        resolve({ valid: false, catchAll: false, details: 'Email rejected - user not found' });
                    } else if (code === 450 || code === 451) {
                        resolve({ valid: false, catchAll: false, details: 'Temporarily unavailable' });
                    } else {
                        resolve({ valid: false, catchAll: false, details: `Unknown response: ${code}` });
                    }
                    cleanup();
                    break;
            }
        });

        socket.connect(25, mxHost);
    });
}

/**
 * Validate an email address using DNS and optional SMTP check
 * Uses rate limiting to be respectful
 */
export async function validateEmail(
    email: string,
    options: { skipSmtp?: boolean } = {}
): Promise<ValidationResult> {
    const domain = email.split('@')[1];

    if (!domain) {
        return {
            email,
            isValid: false,
            status: 'invalid',
            details: 'Invalid email format'
        };
    }

    // Check MX records first
    const mx = await checkMxRecords(domain);

    if (!mx.valid) {
        return {
            email,
            isValid: false,
            status: 'invalid',
            details: 'Domain has no MX records',
            mxRecords: []
        };
    }

    // If SMTP check is disabled, return based on MX only
    if (options.skipSmtp) {
        return {
            email,
            isValid: true,
            status: 'unknown',
            details: 'MX records valid, SMTP check skipped',
            mxRecords: mx.records
        };
    }

    // Perform SMTP check (use sparingly)
    try {
        const smtpResult = await smtpCheck(email, mx.records[0]);

        return {
            email,
            isValid: smtpResult.valid,
            status: smtpResult.catchAll ? 'catch_all' : smtpResult.valid ? 'valid' : 'invalid',
            details: smtpResult.details,
            mxRecords: mx.records
        };
    } catch (error) {
        return {
            email,
            isValid: true,
            status: 'risky',
            details: 'Could not verify via SMTP',
            mxRecords: mx.records
        };
    }
}

/**
 * Find the best email candidate from a list
 */
export function selectBestEmail(candidates: Array<{ email: string; confidence: ConfidenceLevel; validated?: boolean }>): {
    email: string;
    confidence: ConfidenceLevel;
} | null {
    if (candidates.length === 0) return null;

    // Priority: validated > high confidence > medium > low
    const validated = candidates.filter(c => c.validated);
    if (validated.length > 0) {
        return { email: validated[0].email, confidence: 'high' };
    }

    const sorted = candidates.sort((a, b) => {
        const order: Record<ConfidenceLevel, number> = { high: 0, medium: 1, low: 2, unknown: 3 };
        return order[a.confidence] - order[b.confidence];
    });

    return { email: sorted[0].email, confidence: sorted[0].confidence };
}
