import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { applicationsController } from '../controllers/applications.controller';
import { emailController } from '../controllers/email.controller';
import { authenticate, authenticateJWT } from '../middleware/auth.middleware';
import {
  validate,
  signupSchema,
  loginSchema,
  updateProfileSchema,
  emailTemplateSchema,
  syncApplicationsSchema,
  sendEmailSchema,
  updateApplicationSchema,
  settingsSchema,
} from '../middleware/validation.middleware';
import multer from 'multer';
import path from 'path';
import { query } from '../config/database';
import fs from 'fs/promises';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error: any) {
      cb(error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const userId = req.user!.userId;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `resume_${userId}_${timestamp}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

// Auth routes
router.post('/auth/signup', validate(signupSchema), authController.signup.bind(authController));
router.post('/auth/login', validate(loginSchema), authController.login.bind(authController));
router.post('/auth/refresh', authenticateJWT, authController.refresh.bind(authController));
router.get('/auth/me', authenticateJWT, authController.me.bind(authController));

// Profile routes
router.put(
  '/profile',
  authenticateJWT,
  validate(updateProfileSchema),
  async (req, res) => {
    try {
      const userId = req.user!.userId;
      const { full_name, phone_number, linkedin_profile_url, preferred_email } = req.body;

      const updates: string[] = [];
      const params: any[] = [];
      let paramCount = 0;

      if (full_name !== undefined) {
        paramCount++;
        updates.push(`full_name = $${paramCount}`);
        params.push(full_name);
      }
      if (phone_number !== undefined) {
        paramCount++;
        updates.push(`phone_number = $${paramCount}`);
        params.push(phone_number);
      }
      if (linkedin_profile_url !== undefined) {
        paramCount++;
        updates.push(`linkedin_profile_url = $${paramCount}`);
        params.push(linkedin_profile_url);
      }
      if (preferred_email !== undefined) {
        paramCount++;
        updates.push(`preferred_email = $${paramCount}`);
        params.push(preferred_email);
      }

      if (updates.length === 0) {
        res.status(400).json({ error: 'No fields to update' });
        return;
      }

      updates.push(`updated_at = NOW()`);
      paramCount++;
      params.push(userId);

      const result = await query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        params
      );

      const { password_hash, ...user } = result.rows[0];
      res.json({ user });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

router.get('/profile/api-token', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const regenerate = req.query.regenerate === 'true';

    let result;
    if (regenerate) {
      const crypto = require('crypto');
      const newToken = crypto.randomBytes(32).toString('hex');
      result = await query(
        'UPDATE users SET api_token = $1 WHERE id = $2 RETURNING api_token',
        [newToken, userId]
      );
    } else {
      result = await query('SELECT api_token FROM users WHERE id = $1', [userId]);
    }

    res.json({ api_token: result.rows[0].api_token });
  } catch (error) {
    console.error('Get API token error:', error);
    res.status(500).json({ error: 'Failed to get API token' });
  }
});

// Resume routes
router.post('/resume/upload', authenticateJWT, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const userId = req.user!.userId;

    // Deactivate old resumes
    await query('UPDATE resumes SET is_active = FALSE WHERE user_id = $1', [userId]);

    // Insert new resume
    const result = await query(
      `INSERT INTO resumes (user_id, file_name, file_size, file_path, mime_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, req.file.originalname, req.file.size, req.file.path, req.file.mimetype]
    );

    res.status(201).json({ resume: result.rows[0] });
  } catch (error) {
    console.error('Upload resume error:', error);
    res.status(500).json({ error: 'Failed to upload resume' });
  }
});

router.get('/resume', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const result = await query(
      'SELECT * FROM resumes WHERE user_id = $1 AND is_active = TRUE LIMIT 1',
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'No resume found' });
      return;
    }

    const { file_path, ...resume } = result.rows[0];
    res.json({ resume });
  } catch (error) {
    console.error('Get resume error:', error);
    res.status(500).json({ error: 'Failed to get resume' });
  }
});

router.get('/resume/download', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const result = await query(
      'SELECT * FROM resumes WHERE user_id = $1 AND is_active = TRUE LIMIT 1',
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'No resume found' });
      return;
    }

    const resume = result.rows[0];
    res.download(resume.file_path, resume.file_name);
  } catch (error) {
    console.error('Download resume error:', error);
    res.status(500).json({ error: 'Failed to download resume' });
  }
});

// Email template routes
router.get('/email-template', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const result = await query(
      'SELECT * FROM email_templates WHERE user_id = $1 AND is_active = TRUE LIMIT 1',
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'No template found' });
      return;
    }

    res.json({ template: result.rows[0] });
  } catch (error) {
    console.error('Get email template error:', error);
    res.status(500).json({ error: 'Failed to get email template' });
  }
});

router.put('/email-template', authenticateJWT, validate(emailTemplateSchema), async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { subject_template, body_template } = req.body;

    const result = await query(
      `UPDATE email_templates
       SET subject_template = $1, body_template = $2, updated_at = NOW()
       WHERE user_id = $3 AND is_active = TRUE
       RETURNING *`,
      [subject_template, body_template, userId]
    );

    res.json({ template: result.rows[0] });
  } catch (error) {
    console.error('Update email template error:', error);
    res.status(500).json({ error: 'Failed to update email template' });
  }
});

router.post('/email-template/preview', authenticateJWT, async (req, res) => {
  try {
    const { subject_template, body_template, sample_data } = req.body;
    const { emailService } = require('../services/email.service');

    const template = { subject_template, body_template };
    const preview = emailService.previewEmail(template, sample_data);

    res.json(preview);
  } catch (error) {
    console.error('Preview email error:', error);
    res.status(500).json({ error: 'Failed to preview email' });
  }
});

// Application routes
router.get('/applications', authenticateJWT, applicationsController.getApplications.bind(applicationsController));
router.get('/applications/:id', authenticateJWT, applicationsController.getApplication.bind(applicationsController));
router.post('/applications/sync', authenticate, validate(syncApplicationsSchema), applicationsController.syncApplications.bind(applicationsController));
router.put('/applications/:id', authenticateJWT, validate(updateApplicationSchema), applicationsController.updateApplication.bind(applicationsController));
router.delete('/applications/:id', authenticateJWT, applicationsController.deleteApplication.bind(applicationsController));

// Email routes
router.post('/emails/send', authenticateJWT, validate(sendEmailSchema), emailController.sendEmails.bind(emailController));
router.post('/emails/send/:application_id', authenticateJWT, emailController.sendSingleEmail.bind(emailController));
router.get('/emails/logs', authenticateJWT, emailController.getEmailLogs.bind(emailController));

// Settings routes
router.get('/settings', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const result = await query('SELECT * FROM user_settings WHERE user_id = $1', [userId]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Settings not found' });
      return;
    }

    const { id, user_id, created_at, updated_at, ...settings } = result.rows[0];
    res.json({ settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

router.put('/settings', authenticateJWT, validate(settingsSchema), async (req, res) => {
  try {
    const userId = req.user!.userId;
    const {
      auto_send_enabled,
      require_manual_approval,
      max_emails_per_day,
      email_rate_limit_minutes,
    } = req.body;

    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 0;

    if (auto_send_enabled !== undefined) {
      paramCount++;
      updates.push(`auto_send_enabled = $${paramCount}`);
      params.push(auto_send_enabled);
    }
    if (require_manual_approval !== undefined) {
      paramCount++;
      updates.push(`require_manual_approval = $${paramCount}`);
      params.push(require_manual_approval);
    }
    if (max_emails_per_day !== undefined) {
      paramCount++;
      updates.push(`max_emails_per_day = $${paramCount}`);
      params.push(max_emails_per_day);
    }
    if (email_rate_limit_minutes !== undefined) {
      paramCount++;
      updates.push(`email_rate_limit_minutes = $${paramCount}`);
      params.push(email_rate_limit_minutes);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    updates.push(`updated_at = NOW()`);
    paramCount++;
    params.push(userId);

    const result = await query(
      `UPDATE user_settings SET ${updates.join(', ')} WHERE user_id = $${paramCount} RETURNING *`,
      params
    );

    const { id, user_id, created_at, updated_at, ...settings } = result.rows[0];
    res.json({ settings });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Dashboard routes
router.get('/dashboard/stats', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user!.userId;

    const statsResult = await query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'pending') as pending,
         COUNT(*) FILTER (WHERE status = 'email_sent') as emails_sent,
         COUNT(*) FILTER (WHERE status = 'failed') as failed,
         COUNT(*) FILTER (WHERE status = 'no_contact_found') as no_contact_found,
         COUNT(*) as total_applications
       FROM job_applications
       WHERE user_id = $1`,
      [userId]
    );

    const syncResult = await query(
      `SELECT sync_completed_at as last_sync_at
       FROM sync_history
       WHERE user_id = $1 AND status = 'completed'
       ORDER BY sync_completed_at DESC
       LIMIT 1`,
      [userId]
    );

    const stats = {
      ...statsResult.rows[0],
      last_sync_at: syncResult.rows[0]?.last_sync_at || null,
    };

    res.json(stats);
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
});

router.get('/dashboard/sync-history', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { page = 1, limit = 20 } = req.query as any;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const countResult = await query(
      'SELECT COUNT(*) FROM sync_history WHERE user_id = $1',
      [userId]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await query(
      `SELECT * FROM sync_history
       WHERE user_id = $1
       ORDER BY sync_started_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, parseInt(limit), offset]
    );

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
    console.error('Get sync history error:', error);
    res.status(500).json({ error: 'Failed to get sync history' });
  }
});

export default router;
