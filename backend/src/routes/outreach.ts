import { Router, Request, Response } from 'express';
import { db } from '../db/database.js';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { encrypt, decrypt, hashEmail } from '../utils/encryption.js';
import { sendEmail, renderTemplate, generateTemplateVariables, textToHtml } from '../services/emailSender.js';
import { jobQueue } from '../services/queue.js';

const router = Router();

// Validation schemas
const createOutreachSchema = z.object({
    person_id: z.string(),
    template_id: z.string().optional(),
    subject: z.string().min(1),
    body: z.string().min(1),
    schedule_at: z.string().optional(),
});

const bulkOutreachSchema = z.object({
    person_ids: z.array(z.string()).min(1),
    template_id: z.string(),
    custom_variables: z.record(z.string()).optional(),
    schedule_at: z.string().optional(),
});

// Register email job handler
jobQueue.registerHandler('send_email', async (payload: any) => {
    const { outreachId, to, subject, body } = payload;

    // Check unsubscribe before sending
    const emailHash = hashEmail(to);
    const unsubbed = db.prepare(
        'SELECT id FROM unsubscribe_records WHERE email_hash = ?'
    ).get(emailHash);

    if (unsubbed) {
        db.prepare(`
      UPDATE outreach_messages SET status = ?, updated_at = ? WHERE id = ?
    `).run('do_not_contact', new Date().toISOString(), outreachId);
        return { skipped: true, reason: 'unsubscribed' };
    }

    // Send the email
    const result = await sendEmail({
        to,
        subject,
        text: body,
        html: textToHtml(body),
    });

    const now = new Date().toISOString();

    if (result.success) {
        db.prepare(`
      UPDATE outreach_messages SET status = ?, sent_at = ?, updated_at = ? WHERE id = ?
    `).run('sent', now, now, outreachId);
    } else {
        const isBounce = result.error?.includes('rejected') || result.error?.includes('not exist');
        db.prepare(`
      UPDATE outreach_messages SET status = ?, bounce_reason = ?, updated_at = ? WHERE id = ?
    `).run(isBounce ? 'bounced' : 'failed', result.error, now, outreachId);
    }

    return result;
});

// GET /api/outreach - List all outreach messages
router.get('/', (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 20;
        const offset = (page - 1) * pageSize;
        const status = req.query.status as string;
        const personId = req.query.person_id as string;

        let query = `
      SELECT o.*, p.full_name, p.title, c.name as company_name
      FROM outreach_messages o
      LEFT JOIN people p ON o.person_id = p.id
      LEFT JOIN companies c ON o.company_id = c.id
      WHERE 1=1
    `;
        let countQuery = 'SELECT COUNT(*) as total FROM outreach_messages WHERE 1=1';
        const params: any[] = [];

        if (status) {
            query += ' AND o.status = ?';
            countQuery += ' AND status = ?';
            params.push(status);
        }

        if (personId) {
            query += ' AND o.person_id = ?';
            countQuery += ' AND person_id = ?';
            params.push(personId);
        }

        query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
        params.push(pageSize, offset);

        const messages = db.prepare(query).all(...params) as any[];
        const countParams = params.slice(0, -2);
        const totalResult = db.prepare(countQuery).get(...countParams) as { total: number };

        // Decrypt email addresses
        const messagesWithEmail = messages.map(m => ({
            ...m,
            email_used: decrypt(m.email_used_encrypted),
            email_used_encrypted: undefined,
        }));

        res.json({
            success: true,
            data: {
                items: messagesWithEmail,
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

// GET /api/outreach/stats - Get outreach statistics
router.get('/stats', (req: Request, res: Response) => {
    try {
        const stats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
        SUM(CASE WHEN status = 'opened' THEN 1 ELSE 0 END) as opened,
        SUM(CASE WHEN status = 'replied' THEN 1 ELSE 0 END) as replied,
        SUM(CASE WHEN status = 'bounced' THEN 1 ELSE 0 END) as bounced,
        SUM(CASE WHEN status = 'pending' OR status = 'queued' THEN 1 ELSE 0 END) as pending_queue
      FROM outreach_messages
    `).get() as any;

        const queueStats = jobQueue.getStats();

        res.json({
            success: true,
            data: {
                ...stats,
                queue: queueStats,
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/outreach/:id - Get single outreach message
router.get('/:id', (req: Request, res: Response) => {
    try {
        const message = db.prepare(`
      SELECT o.*, p.full_name, p.title, c.name as company_name
      FROM outreach_messages o
      LEFT JOIN people p ON o.person_id = p.id
      LEFT JOIN companies c ON o.company_id = c.id
      WHERE o.id = ?
    `).get(req.params.id) as any;

        if (!message) {
            return res.status(404).json({ success: false, error: 'Message not found' });
        }

        message.email_used = decrypt(message.email_used_encrypted);
        delete message.email_used_encrypted;

        res.json({ success: true, data: message });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/outreach - Create new outreach message
router.post('/', (req: Request, res: Response) => {
    try {
        const validation = createOutreachSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validation.error.errors,
            });
        }

        const data = validation.data;

        // Get person and their primary email
        const person = db.prepare(`
      SELECT p.*, c.id as company_id, c.name as company_name
      FROM people p
      LEFT JOIN companies c ON p.company_id = c.id
      WHERE p.id = ?
    `).get(data.person_id) as any;

        if (!person) {
            return res.status(404).json({ success: false, error: 'Person not found' });
        }

        if (person.do_not_contact) {
            return res.status(400).json({ success: false, error: 'Person is marked as do not contact' });
        }

        // Get primary email
        const emailRecord = db.prepare(
            'SELECT * FROM emails WHERE person_id = ? AND is_primary = 1'
        ).get(data.person_id) as any;

        if (!emailRecord) {
            return res.status(400).json({ success: false, error: 'No primary email found for this person' });
        }

        const email = decrypt(emailRecord.email_encrypted);
        const emailHash = hashEmail(email);

        // Check unsubscribe
        const unsubbed = db.prepare(
            'SELECT id FROM unsubscribe_records WHERE email_hash = ?'
        ).get(emailHash);

        if (unsubbed) {
            return res.status(400).json({ success: false, error: 'This email has unsubscribed' });
        }

        const id = nanoid();
        const now = new Date().toISOString();
        const templateName = data.template_id || 'custom';

        // Count existing messages to this person for sequence number
        const existingCount = db.prepare(
            'SELECT COUNT(*) as count FROM outreach_messages WHERE person_id = ?'
        ).get(data.person_id) as { count: number };

        db.prepare(`
      INSERT INTO outreach_messages (
        id, person_id, company_id, email_used_encrypted, subject, body,
        template_name, sequence_number, scheduled_at, status, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            id,
            data.person_id,
            person.company_id,
            encrypt(email),
            data.subject,
            data.body,
            templateName,
            existingCount.count + 1,
            data.schedule_at || null,
            data.schedule_at ? 'queued' : 'draft',
            now,
            now
        );

        // If scheduled, add to queue
        if (data.schedule_at) {
            jobQueue.addJob(id, 'send_email', {
                outreachId: id,
                to: email,
                subject: data.subject,
                body: data.body,
            }, {
                scheduledAt: new Date(data.schedule_at),
            });
        }

        const message = db.prepare('SELECT * FROM outreach_messages WHERE id = ?').get(id);
        res.status(201).json({ success: true, data: message });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/outreach/bulk - Create bulk outreach
router.post('/bulk', async (req: Request, res: Response) => {
    try {
        const validation = bulkOutreachSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validation.error.errors,
            });
        }

        const data = validation.data;

        // Get template
        const template = db.prepare('SELECT * FROM email_templates WHERE id = ?').get(data.template_id) as any;
        if (!template) {
            return res.status(404).json({ success: false, error: 'Template not found' });
        }

        const results = [];
        const now = new Date().toISOString();
        let scheduleOffset = 0;

        for (const personId of data.person_ids) {
            // Get person
            const person = db.prepare(`
        SELECT p.*, c.id as company_id, c.name as company_name
        FROM people p
        LEFT JOIN companies c ON p.company_id = c.id
        WHERE p.id = ?
      `).get(personId) as any;

            if (!person || person.do_not_contact) {
                results.push({ personId, success: false, error: 'Person not found or do not contact' });
                continue;
            }

            // Get primary email
            const emailRecord = db.prepare(
                'SELECT * FROM emails WHERE person_id = ? AND is_primary = 1'
            ).get(personId) as any;

            if (!emailRecord) {
                results.push({ personId, success: false, error: 'No primary email' });
                continue;
            }

            const email = decrypt(emailRecord.email_encrypted);
            const emailHash = hashEmail(email);

            // Check unsubscribe
            const unsubbed = db.prepare(
                'SELECT id FROM unsubscribe_records WHERE email_hash = ?'
            ).get(emailHash);

            if (unsubbed) {
                results.push({ personId, success: false, error: 'Unsubscribed' });
                continue;
            }

            // Generate template variables
            const variables = {
                ...generateTemplateVariables(person, { name: person.company_name }),
                ...(data.custom_variables || {}),
            };

            const subject = renderTemplate(template.subject, variables);
            const body = renderTemplate(template.body, variables);

            const id = nanoid();
            const existingCount = db.prepare(
                'SELECT COUNT(*) as count FROM outreach_messages WHERE person_id = ?'
            ).get(personId) as { count: number };

            // Calculate schedule time (stagger sends)
            const scheduleAt = data.schedule_at
                ? new Date(new Date(data.schedule_at).getTime() + scheduleOffset)
                : new Date(Date.now() + scheduleOffset);

            scheduleOffset += 180000; // 3 minutes between each

            db.prepare(`
        INSERT INTO outreach_messages (
          id, person_id, company_id, email_used_encrypted, subject, body,
          template_name, sequence_number, scheduled_at, status, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
                id,
                personId,
                person.company_id,
                encrypt(email),
                subject,
                body,
                template.name,
                existingCount.count + 1,
                scheduleAt.toISOString(),
                'queued',
                now,
                now
            );

            // Add to queue
            jobQueue.addJob(id, 'send_email', {
                outreachId: id,
                to: email,
                subject,
                body,
            }, {
                scheduledAt: scheduleAt,
            });

            results.push({ personId, success: true, outreachId: id });
        }

        res.status(201).json({
            success: true,
            data: {
                total: data.person_ids.length,
                queued: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length,
                results,
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/outreach/:id/send - Send a draft immediately
router.post('/:id/send', async (req: Request, res: Response) => {
    try {
        const message = db.prepare('SELECT * FROM outreach_messages WHERE id = ?').get(req.params.id) as any;

        if (!message) {
            return res.status(404).json({ success: false, error: 'Message not found' });
        }

        if (message.status !== 'draft' && message.status !== 'queued') {
            return res.status(400).json({ success: false, error: 'Message is not in draft or queued status' });
        }

        const email = decrypt(message.email_used_encrypted);

        // Add to queue for immediate send
        jobQueue.addJob(message.id, 'send_email', {
            outreachId: message.id,
            to: email,
            subject: message.subject,
            body: message.body,
        });

        db.prepare(`
      UPDATE outreach_messages SET status = ?, updated_at = ? WHERE id = ?
    `).run('pending', new Date().toISOString(), message.id);

        res.json({ success: true, message: 'Message queued for sending' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/outreach/:id/cancel - Cancel a queued message
router.post('/:id/cancel', (req: Request, res: Response) => {
    try {
        const message = db.prepare('SELECT * FROM outreach_messages WHERE id = ?').get(req.params.id) as any;

        if (!message) {
            return res.status(404).json({ success: false, error: 'Message not found' });
        }

        if (message.status !== 'queued' && message.status !== 'pending') {
            return res.status(400).json({ success: false, error: 'Cannot cancel message in this status' });
        }

        jobQueue.cancelJob(message.id);

        db.prepare(`
      UPDATE outreach_messages SET status = ?, updated_at = ? WHERE id = ?
    `).run('draft', new Date().toISOString(), message.id);

        res.json({ success: true, message: 'Message cancelled' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/outreach/:id/mark-replied - Mark as replied
router.post('/:id/mark-replied', (req: Request, res: Response) => {
    try {
        db.prepare(`
      UPDATE outreach_messages SET status = ?, replies = replies + 1, updated_at = ? WHERE id = ?
    `).run('replied', new Date().toISOString(), req.params.id);

        res.json({ success: true, message: 'Marked as replied' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/outreach/:id - Delete outreach message
router.delete('/:id', (req: Request, res: Response) => {
    try {
        const existing = db.prepare('SELECT * FROM outreach_messages WHERE id = ?').get(req.params.id);
        if (!existing) {
            return res.status(404).json({ success: false, error: 'Message not found' });
        }

        jobQueue.cancelJob(req.params.id);
        db.prepare('DELETE FROM outreach_messages WHERE id = ?').run(req.params.id);

        res.json({ success: true, message: 'Message deleted' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
