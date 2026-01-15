import { Router, Request, Response } from 'express';
import { db } from '../db/database.js';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { encrypt, decrypt, hashEmail } from '../utils/encryption.js';
import { generateEmailCandidates, validateEmail, selectBestEmail } from '../services/emailDiscovery.js';
import { inferSeniority } from '../services/discovery.js';

const router = Router();

// Validation schemas
const createPersonSchema = z.object({
    company_id: z.string(),
    full_name: z.string().min(1),
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    title: z.string().optional(),
    location: z.string().optional(),
    linkedin_url: z.string().url().optional(),
    seniority_tag: z.string().optional(),
    source: z.string().default('manual'),
    source_details: z.string().optional(),
});

const updatePersonSchema = createPersonSchema.partial().omit({ company_id: true });

// Helper to decrypt emails
function decryptPersonEmails(personId: string): any[] {
    const encryptedEmails = db.prepare(
        'SELECT * FROM emails WHERE person_id = ?'
    ).all(personId) as any[];

    return encryptedEmails.map(e => ({
        ...e,
        email: decrypt(e.email_encrypted),
        email_encrypted: undefined,
    }));
}

// GET /api/people - List all people
router.get('/', (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 20;
        const offset = (page - 1) * pageSize;
        const companyId = req.query.company_id as string;
        const search = req.query.search as string;
        const seniority = req.query.seniority as string;

        let query = `
      SELECT p.*, c.name as company_name, c.domain as company_domain
      FROM people p
      LEFT JOIN companies c ON p.company_id = c.id
      WHERE 1=1
    `;
        let countQuery = 'SELECT COUNT(*) as total FROM people WHERE 1=1';
        const params: any[] = [];

        if (companyId) {
            query += ' AND p.company_id = ?';
            countQuery += ' AND company_id = ?';
            params.push(companyId);
        }

        if (search) {
            query += ' AND (p.full_name LIKE ? OR p.title LIKE ?)';
            countQuery += ' AND (full_name LIKE ? OR title LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }

        if (seniority) {
            query += ' AND p.seniority_tag = ?';
            countQuery += ' AND seniority_tag = ?';
            params.push(seniority);
        }

        query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
        params.push(pageSize, offset);

        const people = db.prepare(query).all(...params) as any[];
        const countParams = params.slice(0, -2);
        const totalResult = db.prepare(countQuery).get(...countParams) as { total: number };

        // Add decrypted emails to each person
        const peopleWithEmails = people.map(person => ({
            ...person,
            emails: decryptPersonEmails(person.id),
        }));

        res.json({
            success: true,
            data: {
                items: peopleWithEmails,
                total: totalResult.total,
                page,
                pageSize,
                totalPages: Math.ceil(totalResult.total / pageSize),
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/people/:id - Get single person
router.get('/:id', (req: Request, res: Response) => {
    try {
        const person = db.prepare(`
      SELECT p.*, c.name as company_name, c.domain as company_domain
      FROM people p
      LEFT JOIN companies c ON p.company_id = c.id
      WHERE p.id = ?
    `).get(req.params.id) as any;

        if (!person) {
            return res.status(404).json({ success: false, error: 'Person not found' });
        }

        person.emails = decryptPersonEmails(person.id);

        // Get outreach history
        const outreach = db.prepare(`
      SELECT * FROM outreach_messages WHERE person_id = ? ORDER BY created_at DESC
    `).all(req.params.id);

        res.json({
            success: true,
            data: { ...person, outreach_history: outreach },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/people - Create new person
router.post('/', (req: Request, res: Response) => {
    try {
        const validation = createPersonSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validation.error.errors,
            });
        }

        const data = validation.data;
        const id = nanoid();
        const now = new Date().toISOString();

        // Infer seniority if not provided
        const seniorityTag = data.seniority_tag || inferSeniority(data.title || null);

        db.prepare(`
      INSERT INTO people (
        id, company_id, full_name, first_name, last_name, title, location,
        linkedin_url, seniority_tag, source, source_details, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            id,
            data.company_id,
            data.full_name,
            data.first_name,
            data.last_name,
            data.title || null,
            data.location || null,
            data.linkedin_url || null,
            seniorityTag,
            data.source,
            data.source_details || null,
            now,
            now
        );

        const person = db.prepare('SELECT * FROM people WHERE id = ?').get(id);
        res.status(201).json({ success: true, data: person });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/people/:id - Update person
router.put('/:id', (req: Request, res: Response) => {
    try {
        const validation = updatePersonSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validation.error.errors,
            });
        }

        const existing = db.prepare('SELECT * FROM people WHERE id = ?').get(req.params.id);
        if (!existing) {
            return res.status(404).json({ success: false, error: 'Person not found' });
        }

        const data = validation.data;
        const now = new Date().toISOString();
        const updates: string[] = [];
        const values: any[] = [];

        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined) {
                updates.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (updates.length > 0) {
            updates.push('updated_at = ?');
            values.push(now);
            values.push(req.params.id);

            db.prepare(`UPDATE people SET ${updates.join(', ')} WHERE id = ?`).run(...values);
        }

        const person = db.prepare('SELECT * FROM people WHERE id = ?').get(req.params.id);
        res.json({ success: true, data: person });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/people/:id - Delete person
router.delete('/:id', (req: Request, res: Response) => {
    try {
        const existing = db.prepare('SELECT * FROM people WHERE id = ?').get(req.params.id);
        if (!existing) {
            return res.status(404).json({ success: false, error: 'Person not found' });
        }

        db.prepare('DELETE FROM people WHERE id = ?').run(req.params.id);
        res.json({ success: true, message: 'Person deleted' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/people/:id/do-not-contact - Mark as do not contact
router.post('/:id/do-not-contact', (req: Request, res: Response) => {
    try {
        const now = new Date().toISOString();

        db.prepare(`
      UPDATE people SET do_not_contact = 1, updated_at = ? WHERE id = ?
    `).run(now, req.params.id);

        // Also add their emails to unsubscribe list
        const emails = db.prepare(
            'SELECT email_encrypted, email_hash FROM emails WHERE person_id = ?'
        ).all(req.params.id) as any[];

        for (const email of emails) {
            db.prepare(`
        INSERT OR IGNORE INTO unsubscribe_records (id, email_hash, unsubscribed_at, source)
        VALUES (?, ?, ?, ?)
      `).run(nanoid(), email.email_hash, now, 'user_marked');
        }

        res.json({ success: true, message: 'Marked as do not contact' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/people/:id/generate-emails - Generate email candidates
router.post('/:id/generate-emails', async (req: Request, res: Response) => {
    try {
        const person = db.prepare(`
      SELECT p.*, c.domain as company_domain
      FROM people p
      LEFT JOIN companies c ON p.company_id = c.id
      WHERE p.id = ?
    `).get(req.params.id) as any;

        if (!person) {
            return res.status(404).json({ success: false, error: 'Person not found' });
        }

        if (!person.company_domain) {
            return res.status(400).json({ success: false, error: 'Company domain not set' });
        }

        // Generate candidates
        const candidates = generateEmailCandidates(
            person.first_name,
            person.last_name,
            person.company_domain
        );

        const now = new Date().toISOString();
        const insertEmail = db.prepare(`
      INSERT OR IGNORE INTO emails (
        id, person_id, email_encrypted, email_hash, confidence_level,
        validation_status, is_primary, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

        const savedEmails = [];
        for (let i = 0; i < candidates.length; i++) {
            const candidate = candidates[i];
            const emailHash = hashEmail(candidate.email);

            // Check if already unsubscribed
            const unsubbed = db.prepare(
                'SELECT id FROM unsubscribe_records WHERE email_hash = ?'
            ).get(emailHash);

            if (!unsubbed) {
                const id = nanoid();
                insertEmail.run(
                    id,
                    person.id,
                    encrypt(candidate.email),
                    emailHash,
                    candidate.confidence,
                    'pending',
                    i === 0 ? 1 : 0, // First one is primary
                    now
                );
                savedEmails.push({
                    id,
                    email: candidate.email,
                    pattern: candidate.pattern,
                    confidence: candidate.confidence,
                });
            }
        }

        res.json({
            success: true,
            data: { generated: savedEmails.length, emails: savedEmails },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/people/:id/validate-emails - Validate email candidates
router.post('/:id/validate-emails', async (req: Request, res: Response) => {
    try {
        const skipSmtp = req.body.skipSmtp !== false;
        const emails = db.prepare(
            'SELECT * FROM emails WHERE person_id = ? AND validation_status = ?'
        ).all(req.params.id, 'pending') as any[];

        const results = [];
        for (const emailRecord of emails) {
            const email = decrypt(emailRecord.email_encrypted);

            // Validate with appropriate method
            const result = await validateEmail(email, { skipSmtp });

            // Update record
            db.prepare(`
        UPDATE emails SET
          validation_status = ?,
          validation_details = ?,
          last_checked_at = ?
        WHERE id = ?
      `).run(
                result.status,
                result.details,
                new Date().toISOString(),
                emailRecord.id
            );

            results.push({
                email,
                status: result.status,
                details: result.details,
            });
        }

        res.json({ success: true, data: { validated: results.length, results } });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/people/:id/add-email - Manually add an email
router.post('/:id/add-email', (req: Request, res: Response) => {
    try {
        const { email, confidence = 'high' } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, error: 'Email required' });
        }

        const emailHash = hashEmail(email);
        const now = new Date().toISOString();

        // Check if unsubscribed
        const unsubbed = db.prepare(
            'SELECT id FROM unsubscribe_records WHERE email_hash = ?'
        ).get(emailHash);

        if (unsubbed) {
            return res.status(400).json({
                success: false,
                error: 'This email has unsubscribed and cannot be added',
            });
        }

        // Check for existing
        const existing = db.prepare(
            'SELECT id FROM emails WHERE person_id = ? AND email_hash = ?'
        ).get(req.params.id, emailHash);

        if (existing) {
            return res.status(400).json({ success: false, error: 'Email already exists' });
        }

        const id = nanoid();
        db.prepare(`
      INSERT INTO emails (
        id, person_id, email_encrypted, email_hash, confidence_level,
        validation_status, is_primary, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.params.id, encrypt(email), emailHash, confidence, 'pending', 0, now);

        res.status(201).json({ success: true, data: { id, email, confidence } });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/people/:id/emails/:emailId/primary - Set primary email
router.put('/:id/emails/:emailId/primary', (req: Request, res: Response) => {
    try {
        const now = new Date().toISOString();

        // Clear other primaries
        db.prepare('UPDATE emails SET is_primary = 0 WHERE person_id = ?').run(req.params.id);

        // Set this as primary
        db.prepare('UPDATE emails SET is_primary = 1 WHERE id = ? AND person_id = ?').run(
            req.params.emailId,
            req.params.id
        );

        res.json({ success: true, message: 'Primary email updated' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
