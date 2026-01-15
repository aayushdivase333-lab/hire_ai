import { Router, Request, Response } from 'express';
import { db } from '../db/database.js';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { extractDomain } from '../services/discovery.js';

const router = Router();

// Validation schemas
const createCompanySchema = z.object({
    name: z.string().min(1).max(255),
    domain: z.string().optional(),
    website_url: z.string().url().optional(),
    industry: z.string().optional(),
    size: z.string().optional(),
    location: z.string().optional(),
    notes: z.string().optional(),
});

const updateCompanySchema = createCompanySchema.partial();

// GET /api/companies - List all companies
router.get('/', (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 20;
        const offset = (page - 1) * pageSize;
        const search = req.query.search as string;

        let query = 'SELECT * FROM companies';
        let countQuery = 'SELECT COUNT(*) as total FROM companies';
        const params: any[] = [];

        if (search) {
            query += ' WHERE name LIKE ? OR domain LIKE ?';
            countQuery += ' WHERE name LIKE ? OR domain LIKE ?';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(pageSize, offset);

        const companies = db.prepare(query).all(...params);
        const totalResult = db.prepare(countQuery).get(...params.slice(0, -2)) as { total: number };

        res.json({
            success: true,
            data: {
                items: companies,
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

// GET /api/companies/:id - Get single company
router.get('/:id', (req: Request, res: Response) => {
    try {
        const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(req.params.id);

        if (!company) {
            return res.status(404).json({ success: false, error: 'Company not found' });
        }

        // Get associated people count
        const peopleCount = db.prepare(
            'SELECT COUNT(*) as count FROM people WHERE company_id = ?'
        ).get(req.params.id) as { count: number };

        res.json({
            success: true,
            data: { ...company, peopleCount: peopleCount.count },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/companies - Create new company
router.post('/', (req: Request, res: Response) => {
    try {
        const validation = createCompanySchema.safeParse(req.body);
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

        // Extract domain from website if not provided
        let domain = data.domain;
        if (!domain && data.website_url) {
            domain = extractDomain(data.website_url);
        }

        db.prepare(`
      INSERT INTO companies (id, name, domain, website_url, industry, size, location, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            id,
            data.name,
            domain || null,
            data.website_url || null,
            data.industry || null,
            data.size || null,
            data.location || null,
            data.notes || null,
            now,
            now
        );

        // Log audit event
        db.prepare(`
      INSERT INTO audit_log (id, action, entity_type, entity_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(nanoid(), 'create', 'company', id, JSON.stringify({ name: data.name }), now);

        const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(id);
        res.status(201).json({ success: true, data: company });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/companies/:id - Update company
router.put('/:id', (req: Request, res: Response) => {
    try {
        const validation = updateCompanySchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validation.error.errors,
            });
        }

        const existing = db.prepare('SELECT * FROM companies WHERE id = ?').get(req.params.id);
        if (!existing) {
            return res.status(404).json({ success: false, error: 'Company not found' });
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

            db.prepare(`UPDATE companies SET ${updates.join(', ')} WHERE id = ?`).run(...values);
        }

        const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(req.params.id);
        res.json({ success: true, data: company });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/companies/:id - Delete company
router.delete('/:id', (req: Request, res: Response) => {
    try {
        const existing = db.prepare('SELECT * FROM companies WHERE id = ?').get(req.params.id);
        if (!existing) {
            return res.status(404).json({ success: false, error: 'Company not found' });
        }

        // Delete will cascade to people
        db.prepare('DELETE FROM companies WHERE id = ?').run(req.params.id);

        // Log audit event
        const now = new Date().toISOString();
        db.prepare(`
      INSERT INTO audit_log (id, action, entity_type, entity_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(nanoid(), 'delete', 'company', req.params.id, JSON.stringify(existing), now);

        res.json({ success: true, message: 'Company deleted' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/companies/domain/:domain - Delete all data for a domain (GDPR)
router.delete('/domain/:domain', (req: Request, res: Response) => {
    try {
        const domain = req.params.domain;

        // Find all companies with this domain
        const companies = db.prepare('SELECT id FROM companies WHERE domain = ?').all(domain) as { id: string }[];

        // Delete each company (cascades to people)
        for (const company of companies) {
            db.prepare('DELETE FROM companies WHERE id = ?').run(company.id);
        }

        // Log audit event
        const now = new Date().toISOString();
        db.prepare(`
      INSERT INTO audit_log (id, action, entity_type, entity_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(nanoid(), 'delete_domain', 'company', domain, JSON.stringify({ companiesDeleted: companies.length }), now);

        res.json({
            success: true,
            message: `Deleted all data for domain: ${domain}`,
            companiesDeleted: companies.length,
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
