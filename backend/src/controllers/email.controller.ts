import { Request, Response } from 'express';
import { query, getClient } from '../config/database';
import { emailService } from '../services/email.service';
import { JobApplication, User, EmailTemplate, Resume } from '../models/types';

export class EmailController {
  // Send emails for selected applications
  async sendEmails(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { application_ids, force = false } = req.body;

      // Get user settings
      const settingsResult = await query(
        'SELECT * FROM user_settings WHERE user_id = $1',
        [userId]
      );
      const settings = settingsResult.rows[0];

      // Check if auto-send is enabled or manual approval is required
      if (!force && settings.require_manual_approval && !settings.auto_send_enabled) {
        // This is just info, not blocking
      }

      // Check daily email limit
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const sentTodayResult = await query(
        `SELECT COUNT(*) FROM email_logs
         WHERE user_id = $1 AND status = 'sent' AND sent_at >= $2`,
        [userId, todayStart]
      );
      const sentToday = parseInt(sentTodayResult.rows[0].count);

      if (sentToday >= settings.max_emails_per_day) {
        res.status(429).json({
          error: 'Rate limit exceeded',
          message: `Maximum emails per day (${settings.max_emails_per_day}) reached`,
          retry_after: 86400,
        });
        return;
      }

      // Get user, template, and resume
      const userResult = await query('SELECT * FROM users WHERE id = $1', [userId]);
      const user = userResult.rows[0] as User;

      const templateResult = await query(
        'SELECT * FROM email_templates WHERE user_id = $1 AND is_active = TRUE LIMIT 1',
        [userId]
      );

      if (templateResult.rows.length === 0) {
        res.status(400).json({
          error: 'Bad request',
          message: 'No email template configured',
        });
        return;
      }

      const template = templateResult.rows[0] as EmailTemplate;

      const resumeResult = await query(
        'SELECT * FROM resumes WHERE user_id = $1 AND is_active = TRUE LIMIT 1',
        [userId]
      );
      const resume = resumeResult.rows.length > 0 ? (resumeResult.rows[0] as Resume) : undefined;

      // Process each application
      const results = [];
      let queued = 0;
      let sent = 0;
      let failed = 0;

      for (const appId of application_ids) {
        try {
          // Get application
          const appResult = await query(
            'SELECT * FROM job_applications WHERE id = $1 AND user_id = $2',
            [appId, userId]
          );

          if (appResult.rows.length === 0) {
            results.push({
              application_id: appId,
              status: 'failed',
              error: 'Application not found',
            });
            failed++;
            continue;
          }

          const application = appResult.rows[0] as JobApplication;

          // Check if recruiter email exists
          if (!application.recruiter_email) {
            results.push({
              application_id: appId,
              status: 'failed',
              error: 'No recruiter email found',
            });
            failed++;
            continue;
          }

          // Build placeholders and generate email content
          const placeholders = emailService.buildPlaceholders(application, user);
          const { subject, body } = emailService.generateEmailContent(template, placeholders);

          // Send email
          const emailResult = await emailService.sendEmail(
            application.recruiter_email,
            subject,
            body,
            user.preferred_email,
            user.full_name,
            resume
          );

          // Create email log
          const logResult = await query(
            `INSERT INTO email_logs (
              user_id, job_application_id, recipient_email,
              subject, body, status, error_message, sent_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id`,
            [
              userId,
              appId,
              application.recruiter_email,
              subject,
              body,
              emailResult.success ? 'sent' : 'failed',
              emailResult.error || null,
              emailResult.success ? new Date() : null,
            ]
          );

          // Update application status
          if (emailResult.success) {
            await query(
              'UPDATE job_applications SET status = $1, updated_at = NOW() WHERE id = $2',
              ['email_sent', appId]
            );
            sent++;
          } else {
            await query(
              'UPDATE job_applications SET status = $1, updated_at = NOW() WHERE id = $2',
              ['failed', appId]
            );
            failed++;
          }

          results.push({
            application_id: appId,
            status: emailResult.success ? 'sent' : 'failed',
            email_log_id: logResult.rows[0].id,
            error: emailResult.error,
          });
        } catch (error: any) {
          console.error(`Error sending email for application ${appId}:`, error);
          results.push({
            application_id: appId,
            status: 'failed',
            error: error.message || 'Unknown error',
          });
          failed++;
        }
      }

      res.json({
        queued,
        sent,
        failed,
        results,
      });
    } catch (error) {
      console.error('Send emails error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to send emails',
      });
    }
  }

  // Send email for single application
  async sendSingleEmail(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { application_id } = req.params;

      // Delegate to sendEmails with single application
      req.body = {
        application_ids: [application_id],
        force: true,
      };

      await this.sendEmails(req, res);
    } catch (error) {
      console.error('Send single email error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to send email',
      });
    }
  }

  // Get email logs
  async getEmailLogs(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const {
        application_id,
        status,
        page = 1,
        limit = 20,
      } = req.query as any;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Build query
      let queryText = `
        SELECT
          el.*,
          ja.job_title,
          ja.company_name
        FROM email_logs el
        JOIN job_applications ja ON el.job_application_id = ja.id
        WHERE el.user_id = $1
      `;
      const params: any[] = [userId];
      let paramCount = 1;

      if (application_id) {
        paramCount++;
        queryText += ` AND el.job_application_id = $${paramCount}`;
        params.push(application_id);
      }

      if (status) {
        paramCount++;
        queryText += ` AND el.status = $${paramCount}`;
        params.push(status);
      }

      // Get total count
      const countResult = await query(
        queryText.replace('SELECT el.*, ja.job_title, ja.company_name', 'SELECT COUNT(*)'),
        params
      );
      const total = parseInt(countResult.rows[0].count);

      // Add sorting and pagination
      queryText += ` ORDER BY el.created_at DESC`;
      queryText += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(parseInt(limit), offset);

      const result = await query(queryText, params);

      res.json({
        data: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          total_pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error('Get email logs error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch email logs',
      });
    }
  }
}

export const emailController = new EmailController();
