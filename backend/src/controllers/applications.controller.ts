import { Request, Response } from 'express';
import { query, getClient } from '../config/database';
import {
  JobApplication,
  ApplicationFilters,
  SyncApplicationsRequest,
  LinkedInApplicationData,
} from '../models/types';

export class ApplicationsController {
  // Get all applications with filters and pagination
  async getApplications(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const {
        company,
        status,
        date_from,
        date_to,
        page = 1,
        limit = 20,
      } = req.query as any;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Build dynamic query
      let queryText = `
        SELECT * FROM job_applications
        WHERE user_id = $1
      `;
      const params: any[] = [userId];
      let paramCount = 1;

      if (company) {
        paramCount++;
        queryText += ` AND company_name ILIKE $${paramCount}`;
        params.push(`%${company}%`);
      }

      if (status) {
        paramCount++;
        queryText += ` AND status = $${paramCount}`;
        params.push(status);
      }

      if (date_from) {
        paramCount++;
        queryText += ` AND application_date >= $${paramCount}`;
        params.push(date_from);
      }

      if (date_to) {
        paramCount++;
        queryText += ` AND application_date <= $${paramCount}`;
        params.push(date_to);
      }

      // Get total count
      const countResult = await query(
        queryText.replace('SELECT *', 'SELECT COUNT(*)'),
        params
      );
      const total = parseInt(countResult.rows[0].count);

      // Add sorting and pagination
      queryText += ` ORDER BY application_date DESC, created_at DESC`;
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
      console.error('Get applications error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch applications',
      });
    }
  }

  // Get single application by ID
  async getApplication(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      const result = await query(
        'SELECT * FROM job_applications WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          error: 'Not found',
          message: 'Application not found',
        });
        return;
      }

      const application = result.rows[0];

      // Get email logs for this application
      const logsResult = await query(
        `SELECT id, recipient_email, subject, status, error_message, sent_at, created_at
         FROM email_logs
         WHERE job_application_id = $1
         ORDER BY created_at DESC`,
        [id]
      );

      res.json({
        application,
        email_logs: logsResult.rows,
      });
    } catch (error) {
      console.error('Get application error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to fetch application',
      });
    }
  }

  // Sync applications from LinkedIn
  async syncApplications(req: Request, res: Response): Promise<void> {
    const client = await getClient();

    try {
      const userId = req.user!.userId;
      const { applications } = req.body as SyncApplicationsRequest;

      await client.query('BEGIN');

      // Create sync history record
      const syncResult = await client.query(
        `INSERT INTO sync_history (user_id, sync_started_at, status, applications_found)
         VALUES ($1, NOW(), 'in_progress', $2)
         RETURNING id`,
        [userId, applications.length]
      );
      const syncId = syncResult.rows[0].id;

      let newCount = 0;
      let updatedCount = 0;

      for (const app of applications) {
        const {
          job_title,
          company_name,
          location,
          application_date,
          application_id,
          job_link,
          job_description,
          recruiter_name,
          recruiter_email,
          linkedin_application_id,
          raw_data,
        } = app;

        // Check if application already exists
        const existingApp = await client.query(
          `SELECT id FROM job_applications
           WHERE user_id = $1 AND linkedin_application_id = $2`,
          [userId, linkedin_application_id]
        );

        if (existingApp.rows.length === 0) {
          // Insert new application
          await client.query(
            `INSERT INTO job_applications (
              user_id, job_title, company_name, location, application_date,
              application_id, job_link, job_description, recruiter_name,
              recruiter_email, linkedin_application_id, raw_data, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
              userId,
              job_title,
              company_name,
              location,
              application_date,
              application_id,
              job_link,
              job_description,
              recruiter_name,
              recruiter_email,
              linkedin_application_id,
              JSON.stringify(raw_data),
              recruiter_email ? 'pending' : 'no_contact_found',
            ]
          );
          newCount++;
        } else {
          // Update existing application
          await client.query(
            `UPDATE job_applications
             SET job_title = $1, company_name = $2, location = $3,
                 application_date = $4, application_id = $5, job_link = $6,
                 job_description = $7, recruiter_name = $8, recruiter_email = $9,
                 raw_data = $10, updated_at = NOW(),
                 status = CASE
                   WHEN status = 'pending' AND $9 IS NOT NULL THEN 'pending'
                   WHEN status = 'pending' AND $9 IS NULL THEN 'no_contact_found'
                   ELSE status
                 END
             WHERE id = $11`,
            [
              job_title,
              company_name,
              location,
              application_date,
              application_id,
              job_link,
              job_description,
              recruiter_name,
              recruiter_email,
              JSON.stringify(raw_data),
              existingApp.rows[0].id,
            ]
          );
          updatedCount++;
        }
      }

      // Update sync history
      await client.query(
        `UPDATE sync_history
         SET sync_completed_at = NOW(), status = 'completed',
             applications_new = $1
         WHERE id = $2`,
        [newCount, syncId]
      );

      await client.query('COMMIT');

      res.json({
        sync_id: syncId,
        applications_found: applications.length,
        applications_new: newCount,
        applications_updated: updatedCount,
        status: 'completed',
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Sync applications error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to sync applications',
      });
    } finally {
      client.release();
    }
  }

  // Update application
  async updateApplication(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const { recruiter_name, recruiter_email, status } = req.body;

      // Verify application belongs to user
      const checkResult = await query(
        'SELECT id FROM job_applications WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (checkResult.rows.length === 0) {
        res.status(404).json({
          error: 'Not found',
          message: 'Application not found',
        });
        return;
      }

      // Build update query dynamically
      const updates: string[] = [];
      const params: any[] = [];
      let paramCount = 0;

      if (recruiter_name !== undefined) {
        paramCount++;
        updates.push(`recruiter_name = $${paramCount}`);
        params.push(recruiter_name);
      }

      if (recruiter_email !== undefined) {
        paramCount++;
        updates.push(`recruiter_email = $${paramCount}`);
        params.push(recruiter_email);
      }

      if (status !== undefined) {
        paramCount++;
        updates.push(`status = $${paramCount}`);
        params.push(status);
      }

      if (updates.length === 0) {
        res.status(400).json({
          error: 'Bad request',
          message: 'No fields to update',
        });
        return;
      }

      updates.push(`updated_at = NOW()`);
      paramCount++;
      params.push(id);
      paramCount++;
      params.push(userId);

      const result = await query(
        `UPDATE job_applications
         SET ${updates.join(', ')}
         WHERE id = $${paramCount - 1} AND user_id = $${paramCount}
         RETURNING *`,
        params
      );

      res.json({
        application: result.rows[0],
      });
    } catch (error) {
      console.error('Update application error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update application',
      });
    }
  }

  // Delete application
  async deleteApplication(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      const result = await query(
        'DELETE FROM job_applications WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, userId]
      );

      if (result.rows.length === 0) {
        res.status(404).json({
          error: 'Not found',
          message: 'Application not found',
        });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error('Delete application error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to delete application',
      });
    }
  }
}

export const applicationsController = new ApplicationsController();
