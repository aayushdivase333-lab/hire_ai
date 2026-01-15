import { Router, Request, Response } from 'express';
import { db } from '../db/database.js';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { renderTemplate, generateTemplateVariables } from '../services/emailSender.js';

const router = Router();

// Validation schemas
const createTemplateSchema = z.object({
    name: z.string().min(1).max(255),
    subject: z.string().min(1),
    body: z.string().min(1),
    template_type: z.enum(['first_touch', 'follow_up_1', 'follow_up_2', 'custom']),
    offer_type: z.enum(['website_support', 'automation_dashboards', 'custom']),
    sequence_position: z.number().int().min(1).default(1),
    is_active: z.boolean().default(true),
});

const updateTemplateSchema = createTemplateSchema.partial();

// GET /api/templates - List all templates
router.get('/', (req: Request, res: Response) => {
    try {
        const type = req.query.type as string;
        const offerType = req.query.offer_type as string;
        const activeOnly = req.query.active !== 'false';

        let query = 'SELECT * FROM email_templates WHERE 1=1';
        const params: any[] = [];

        if (activeOnly) {
            query += ' AND is_active = 1';
        }

        if (type) {
            query += ' AND template_type = ?';
            params.push(type);
        }

        if (offerType) {
            query += ' AND offer_type = ?';
            params.push(offerType);
        }

        query += ' ORDER BY offer_type, sequence_position';

        const templates = db.prepare(query).all(...params);

        res.json({ success: true, data: templates });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/templates/:id - Get single template
router.get('/:id', (req: Request, res: Response) => {
    try {
        const template = db.prepare('SELECT * FROM email_templates WHERE id = ?').get(req.params.id);

        if (!template) {
            return res.status(404).json({ success: false, error: 'Template not found' });
        }

        res.json({ success: true, data: template });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/templates - Create new template
router.post('/', (req: Request, res: Response) => {
    try {
        const validation = createTemplateSchema.safeParse(req.body);
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

        db.prepare(`
      INSERT INTO email_templates (
        id, name, subject, body, template_type, offer_type,
        sequence_position, is_active, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            id,
            data.name,
            data.subject,
            data.body,
            data.template_type,
            data.offer_type,
            data.sequence_position,
            data.is_active ? 1 : 0,
            now,
            now
        );

        const template = db.prepare('SELECT * FROM email_templates WHERE id = ?').get(id);
        res.status(201).json({ success: true, data: template });
    } catch (error: any) {
        if (error.message?.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ success: false, error: 'Template name already exists' });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/templates/:id - Update template
router.put('/:id', (req: Request, res: Response) => {
    try {
        const validation = updateTemplateSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validation.error.errors,
            });
        }

        const existing = db.prepare('SELECT * FROM email_templates WHERE id = ?').get(req.params.id);
        if (!existing) {
            return res.status(404).json({ success: false, error: 'Template not found' });
        }

        const data = validation.data;
        const now = new Date().toISOString();
        const updates: string[] = [];
        const values: any[] = [];

        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined) {
                updates.push(`${key} = ?`);
                values.push(key === 'is_active' ? (value ? 1 : 0) : value);
            }
        }

        if (updates.length > 0) {
            updates.push('updated_at = ?');
            values.push(now);
            values.push(req.params.id);

            db.prepare(`UPDATE email_templates SET ${updates.join(', ')} WHERE id = ?`).run(...values);
        }

        const template = db.prepare('SELECT * FROM email_templates WHERE id = ?').get(req.params.id);
        res.json({ success: true, data: template });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/templates/:id - Delete template
router.delete('/:id', (req: Request, res: Response) => {
    try {
        const existing = db.prepare('SELECT * FROM email_templates WHERE id = ?').get(req.params.id);
        if (!existing) {
            return res.status(404).json({ success: false, error: 'Template not found' });
        }

        db.prepare('DELETE FROM email_templates WHERE id = ?').run(req.params.id);
        res.json({ success: true, message: 'Template deleted' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/templates/:id/preview - Preview template with sample data
router.post('/:id/preview', (req: Request, res: Response) => {
    try {
        const template = db.prepare('SELECT * FROM email_templates WHERE id = ?').get(req.params.id) as any;

        if (!template) {
            return res.status(404).json({ success: false, error: 'Template not found' });
        }

        // Use sample data or provided data
        const samplePerson = {
            firstName: req.body.first_name || 'John',
            lastName: req.body.last_name || 'Smith',
            fullName: req.body.full_name || 'John Smith',
            title: req.body.title || 'Managing Partner',
        };

        const sampleCompany = {
            name: req.body.company_name || 'Acme Capital',
        };

        const variables = {
            ...generateTemplateVariables(samplePerson, sampleCompany),
            ...(req.body.custom_variables || {}),
        };

        const renderedSubject = renderTemplate(template.subject, variables);
        const renderedBody = renderTemplate(template.body, variables);

        res.json({
            success: true,
            data: {
                subject: renderedSubject,
                body: renderedBody,
                variables,
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/templates/:id/duplicate - Duplicate template
router.post('/:id/duplicate', (req: Request, res: Response) => {
    try {
        const template = db.prepare('SELECT * FROM email_templates WHERE id = ?').get(req.params.id) as any;

        if (!template) {
            return res.status(404).json({ success: false, error: 'Template not found' });
        }

        const id = nanoid();
        const now = new Date().toISOString();
        const newName = `${template.name} (Copy)`;

        db.prepare(`
      INSERT INTO email_templates (
        id, name, subject, body, template_type, offer_type,
        sequence_position, is_active, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            id,
            newName,
            template.subject,
            template.body,
            template.template_type,
            template.offer_type,
            template.sequence_position,
            template.is_active,
            now,
            now
        );

        const newTemplate = db.prepare('SELECT * FROM email_templates WHERE id = ?').get(id);
        res.status(201).json({ success: true, data: newTemplate });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
