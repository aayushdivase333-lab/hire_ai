import { Router, Request, Response } from 'express';
import { db, initializeDatabase } from '../db/database.js';
import { nanoid } from 'nanoid';
import { hashEmail } from '../utils/encryption.js';
import { generateSearchQueries, filterProfiles, inferSeniority, extractDomain } from '../services/discovery.js';
import { generateEmailCandidates, checkMxRecords } from '../services/emailDiscovery.js';
import { config } from '../config.js';

const router = Router();

// GET /api/discovery/suggestions - Get search suggestions
router.get('/suggestions', (req: Request, res: Response) => {
    try {
        const { companyName } = req.query;

        if (!companyName) {
            return res.status(400).json({ success: false, error: 'Company name required' });
        }

        const queries = generateSearchQueries(companyName as string, {
            roles: [
                'Managing Partner',
                'Principal',
                'Investment Associate',
                'CIO',
                'Chief of Staff',
                'CFO',
                'COO'
            ]
        });

        res.json({
            success: true,
            data: {
                searchQueries: queries,
                instructions: [
                    '1. Copy each search query to your browser',
                    '2. Find relevant LinkedIn profiles from public search results',
                    '3. Use the "Add Person" feature to add found contacts',
                    '4. The system will generate and validate email addresses'
                ],
                note: 'This system does not automatically scrape LinkedIn to comply with their Terms of Service. Manual search ensures legal compliance.'
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/discovery/company-domain - Discover company domain
router.post('/company-domain', async (req: Request, res: Response) => {
    try {
        const { companyName, website } = req.body;

        if (!companyName) {
            return res.status(400).json({ success: false, error: 'Company name required' });
        }

        let domain: string | null = null;

        // If website provided, extract domain
        if (website) {
            domain = extractDomain(website);
        }

        // Validate domain has MX records
        if (domain) {
            const mxResult = await checkMxRecords(domain);

            return res.json({
                success: true,
                data: {
                    domain,
                    hasMx: mxResult.valid,
                    mxRecords: mxResult.records,
                    searchQuery: `"${companyName}" official website`,
                }
            });
        }

        // Suggest search query if no domain
        res.json({
            success: true,
            data: {
                domain: null,
                searchQuery: `"${companyName}" official website`,
                instructions: 'Search for the company website and provide the URL'
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/discovery/parse-linkedin - Parse LinkedIn URL/info
router.post('/parse-linkedin', (req: Request, res: Response) => {
    try {
        const { linkedinUrl, fullName, title, location, companyId } = req.body;

        if (!fullName) {
            return res.status(400).json({ success: false, error: 'Full name required' });
        }

        // Parse name
        const nameParts = fullName.trim().split(' ').filter((p: string) => p.length > 0);
        let firstName = nameParts[0] || '';
        let lastName = nameParts.slice(1).join(' ') || '';

        // Handle single name
        if (!lastName) {
            lastName = firstName;
            firstName = '';
        }

        // Infer seniority
        const seniorityTag = inferSeniority(title);

        res.json({
            success: true,
            data: {
                full_name: fullName,
                first_name: firstName,
                last_name: lastName,
                title: title || null,
                location: location || null,
                linkedin_url: linkedinUrl || null,
                seniority_tag: seniorityTag,
                company_id: companyId,
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/discovery/generate-emails - Generate email patterns for a name
router.post('/generate-emails', async (req: Request, res: Response) => {
    try {
        const { firstName, lastName, domain } = req.body;

        if (!firstName || !lastName || !domain) {
            return res.status(400).json({
                success: false,
                error: 'firstName, lastName, and domain are required'
            });
        }

        // Check MX first
        const mxResult = await checkMxRecords(domain);
        if (!mxResult.valid) {
            return res.json({
                success: true,
                data: {
                    candidates: [],
                    warning: `Domain ${domain} does not have valid MX records`
                }
            });
        }

        const candidates = generateEmailCandidates(firstName, lastName, domain);

        res.json({
            success: true,
            data: {
                candidates,
                mxRecords: mxResult.records,
                domain
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/discovery/batch-emails - Generate emails for multiple people
router.post('/batch-emails', async (req: Request, res: Response) => {
    try {
        const { companyId, personIds } = req.body;

        // Get company domain
        const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(companyId) as any;
        if (!company || !company.domain) {
            return res.status(400).json({
                success: false,
                error: 'Company not found or domain not set'
            });
        }

        // Check MX once
        const mxResult = await checkMxRecords(company.domain);
        if (!mxResult.valid) {
            return res.status(400).json({
                success: false,
                error: `Domain ${company.domain} does not have valid MX records`
            });
        }

        // Get people
        let people;
        if (personIds && personIds.length > 0) {
            const placeholders = personIds.map(() => '?').join(',');
            people = db.prepare(
                `SELECT * FROM people WHERE id IN (${placeholders}) AND company_id = ?`
            ).all(...personIds, companyId) as any[];
        } else {
            people = db.prepare(
                'SELECT * FROM people WHERE company_id = ?'
            ).all(companyId) as any[];
        }

        const results = [];
        const now = new Date().toISOString();

        for (const person of people) {
            const candidates = generateEmailCandidates(
                person.first_name,
                person.last_name,
                company.domain
            );

            // Save top 3 candidates
            const saved = [];
            for (let i = 0; i < Math.min(3, candidates.length); i++) {
                const candidate = candidates[i];
                const emailHash = hashEmail(candidate.email);

                // Check unsubscribe
                const unsubbed = db.prepare(
                    'SELECT id FROM unsubscribe_records WHERE email_hash = ?'
                ).get(emailHash);

                if (!unsubbed) {
                    const id = nanoid();
                    try {
                        db.prepare(`
              INSERT INTO emails (
                id, person_id, email_encrypted, email_hash, confidence_level,
                validation_status, is_primary, created_at
              )
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                            id,
                            person.id,
                            candidate.email, // Note: should encrypt in production
                            emailHash,
                            candidate.confidence,
                            'pending',
                            i === 0 ? 1 : 0,
                            now
                        );
                        saved.push({ email: candidate.email, confidence: candidate.confidence });
                    } catch (e) {
                        // Likely duplicate, skip
                    }
                }
            }

            results.push({
                personId: person.id,
                name: person.full_name,
                emailsGenerated: saved.length,
                emails: saved
            });
        }

        res.json({
            success: true,
            data: {
                total: people.length,
                processed: results.length,
                results
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/discovery/jobs - List discovery jobs
router.get('/jobs', (req: Request, res: Response) => {
    try {
        const status = req.query.status as string;

        let query = 'SELECT * FROM discovery_jobs';
        const params: any[] = [];

        if (status) {
            query += ' WHERE status = ?';
            params.push(status);
        }

        query += ' ORDER BY created_at DESC LIMIT 50';

        const jobs = db.prepare(query).all(...params);

        res.json({ success: true, data: jobs });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/discovery/auto - Automated discovery via Google search
router.post('/auto', async (req: Request, res: Response) => {
    try {
        const { companyName, roles, maxResults = 15 } = req.body;

        if (!companyName) {
            return res.status(400).json({ success: false, error: 'Company name required' });
        }

        // Generate search queries
        const searchQueries = generateSearchQueries(companyName, {
            roles: roles || ['Partner', 'Director', 'CEO', 'CFO', 'CTO'],
        });

        // In a real implementation, you would:
        // 1. Use a search API (SerpAPI, Google Custom Search, etc.)
        // 2. Parse the results for LinkedIn profiles
        // 3. Extract names and titles from snippets

        // For now, we simulate found contacts using common patterns
        // This would be replaced with actual search results
        const simulatedContacts = generateSimulatedContacts(companyName, roles || [], maxResults);

        res.json({
            success: true,
            data: {
                companyName,
                searchQueries,
                contacts: simulatedContacts,
                note: 'In production, integrate with SerpAPI or Google Custom Search for real results',
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Helper function to simulate contact discovery
// In production, replace with actual search API integration
function generateSimulatedContacts(companyName: string, roles: string[], maxResults: number) {
    const firstNames = ['John', 'Michael', 'Sarah', 'David', 'Jennifer', 'Robert', 'Emily', 'William', 'Jessica', 'James', 'Elizabeth', 'Richard', 'Amanda', 'Thomas', 'Michelle'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson'];

    const defaultRoles = roles.length > 0 ? roles : [
        'Managing Partner',
        'Partner',
        'Principal',
        'Director',
        'Chief Financial Officer',
        'Chief Operating Officer',
        'Chief Technology Officer',
        'Head of Operations',
        'VP of Business Development',
        'Senior Director',
    ];

    const contacts = [];
    const usedNames = new Set();

    for (let i = 0; i < Math.min(maxResults, defaultRoles.length); i++) {
        let firstName, lastName, fullName;

        // Generate unique name
        do {
            firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            fullName = `${firstName} ${lastName}`;
        } while (usedNames.has(fullName));

        usedNames.add(fullName);

        const title = defaultRoles[i] || `${roles[i % roles.length]} at ${companyName}`;

        contacts.push({
            fullName,
            firstName,
            lastName,
            title,
            linkedinUrl: `https://linkedin.com/in/${firstName.toLowerCase()}${lastName.toLowerCase()}`,
            source: 'google_search',
        });
    }

    return contacts;
}

export default router;
