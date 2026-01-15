import { Router, Request, Response } from 'express';
import { db } from '../db/database.js';
import { nanoid } from 'nanoid';
import { hashEmail } from '../utils/encryption.js';
import { verifyConnection } from '../services/emailSender.js';
import { jobQueue } from '../services/queue.js';
import { config } from '../config.js';

const router = Router();

// POST /api/unsubscribe/:token - Handle unsubscribe request
router.post('/unsubscribe/:token', (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, error: 'Email required' });
        }

        const emailHash = hashEmail(email);
        const domain = email.split('@')[1];
        const now = new Date().toISOString();

        // Check if already unsubscribed
        const existing = db.prepare(
            'SELECT id FROM unsubscribe_records WHERE email_hash = ?'
        ).get(emailHash);

        if (!existing) {
            db.prepare(`
        INSERT INTO unsubscribe_records (id, email_hash, domain, unsubscribed_at, source)
        VALUES (?, ?, ?, ?, ?)
      `).run(nanoid(), emailHash, domain, now, 'email_link');
        }

        // Update any people with this email
        const emails = db.prepare(
            'SELECT person_id FROM emails WHERE email_hash = ?'
        ).all(emailHash) as { person_id: string }[];

        for (const { person_id } of emails) {
            db.prepare(`
        UPDATE people SET do_not_contact = 1, updated_at = ? WHERE id = ?
      `).run(now, person_id);
        }

        // Log audit event
        db.prepare(`
      INSERT INTO audit_log (id, action, entity_type, entity_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(nanoid(), 'unsubscribe', 'email', emailHash, JSON.stringify({ source: 'email_link' }), now);

        res.json({ success: true, message: 'Successfully unsubscribed' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/settings - Get current settings
router.get('/settings', (req: Request, res: Response) => {
    try {
        res.json({
            success: true,
            data: {
                smtp: {
                    host: config.smtp.host,
                    port: config.smtp.port,
                    fromName: config.smtp.fromName,
                    fromEmail: config.smtp.fromEmail,
                    configured: !!config.smtp.user && !!config.smtp.pass,
                },
                outreach: {
                    maxEmailsPerHour: config.maxEmailsPerHour,
                    maxEmailsPerDay: config.maxEmailsPerDay,
                    delayBetweenEmailsMs: config.delayBetweenEmailsMs,
                },
                discovery: {
                    maxResultsPerSearch: config.maxResultsPerSearch,
                    searchDelayMs: config.searchDelayMs,
                },
                identity: {
                    myName: config.myName,
                    myEmail: config.myEmail,
                    myServiceSummary: config.myServiceSummary,
                },
                privacy: {
                    dataRetentionDays: config.dataRetentionDays,
                }
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/health - Health check
router.get('/health', async (req: Request, res: Response) => {
    try {
        // Check database
        const dbCheck = db.prepare('SELECT 1 as ok').get() as { ok: number };

        // Check SMTP (optional)
        let smtpOk = false;
        try {
            smtpOk = await verifyConnection();
        } catch (e) {
            // SMTP not configured
        }

        // Get queue stats
        const queueStats = jobQueue.getStats();

        res.json({
            success: true,
            data: {
                status: 'healthy',
                database: dbCheck.ok === 1,
                smtp: smtpOk,
                queue: queueStats,
                timestamp: new Date().toISOString(),
            }
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            data: {
                status: 'unhealthy',
                error: error.message,
            }
        });
    }
});

// GET /api/stats - Get dashboard statistics
router.get('/stats', (req: Request, res: Response) => {
    try {
        const companies = db.prepare('SELECT COUNT(*) as count FROM companies').get() as { count: number };
        const people = db.prepare('SELECT COUNT(*) as count FROM people').get() as { count: number };
        const emails = db.prepare('SELECT COUNT(*) as count FROM emails').get() as { count: number };
        const outreach = db.prepare('SELECT COUNT(*) as count FROM outreach_messages').get() as { count: number };
        const unsubscribed = db.prepare('SELECT COUNT(*) as count FROM unsubscribe_records').get() as { count: number };

        const outreachByStatus = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM outreach_messages
      GROUP BY status
    `).all() as { status: string; count: number }[];

        const recentOutreach = db.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM outreach_messages
      WHERE created_at >= DATE('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `).all() as { date: string; count: number }[];

        const queueStats = jobQueue.getStats();

        res.json({
            success: true,
            data: {
                totals: {
                    companies: companies.count,
                    people: people.count,
                    emails: emails.count,
                    outreach: outreach.count,
                    unsubscribed: unsubscribed.count,
                },
                outreachByStatus: Object.fromEntries(outreachByStatus.map(s => [s.status, s.count])),
                recentOutreach,
                queue: queueStats,
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/audit - Get audit log
router.get('/audit', (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 50;
        const offset = (page - 1) * pageSize;

        const logs = db.prepare(`
      SELECT * FROM audit_log
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(pageSize, offset);

        const total = db.prepare('SELECT COUNT(*) as count FROM audit_log').get() as { count: number };

        res.json({
            success: true,
            data: {
                items: logs,
                total: total.count,
                page,
                pageSize,
                totalPages: Math.ceil(total.count / pageSize),
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/data/cleanup - Clean up old data (GDPR)
router.delete('/data/cleanup', (req: Request, res: Response) => {
    try {
        const daysToKeep = parseInt(req.query.days as string) || config.dataRetentionDays;
        const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000).toISOString();

        // Delete old audit logs
        const auditDeleted = db.prepare(
            'DELETE FROM audit_log WHERE created_at < ?'
        ).run(cutoffDate);

        // Delete old discovery jobs
        const jobsDeleted = db.prepare(
            'DELETE FROM discovery_jobs WHERE created_at < ? AND status IN (?, ?)'
        ).run(cutoffDate, 'completed', 'failed');

        const now = new Date().toISOString();
        db.prepare(`
      INSERT INTO audit_log (id, action, entity_type, entity_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(nanoid(), 'cleanup', 'system', null, JSON.stringify({
            cutoffDate,
            auditLogsDeleted: auditDeleted.changes,
            jobsDeleted: jobsDeleted.changes,
        }), now);

        res.json({
            success: true,
            message: 'Cleanup completed',
            data: {
                auditLogsDeleted: auditDeleted.changes,
                jobsDeleted: jobsDeleted.changes,
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/data/delete-all - Delete all data (nuclear option for GDPR)
router.delete('/data/delete-all', (req: Request, res: Response) => {
    try {
        const confirm = req.query.confirm;

        if (confirm !== 'yes-delete-everything') {
            return res.status(400).json({
                success: false,
                error: 'Add ?confirm=yes-delete-everything to confirm deletion',
            });
        }

        // Delete all data
        db.prepare('DELETE FROM outreach_messages').run();
        db.prepare('DELETE FROM emails').run();
        db.prepare('DELETE FROM people').run();
        db.prepare('DELETE FROM companies').run();
        db.prepare('DELETE FROM discovery_jobs').run();

        // Keep unsubscribe records for compliance
        // Keep audit log for compliance

        const now = new Date().toISOString();
        db.prepare(`
      INSERT INTO audit_log (id, action, entity_type, entity_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(nanoid(), 'delete_all', 'system', null, JSON.stringify({ timestamp: now }), now);

        res.json({ success: true, message: 'All data deleted' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
