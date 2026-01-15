import { Request, Response } from 'express';
import { query } from '../config/database';
import {
  hashPassword,
  verifyPassword,
  generateToken,
  generateApiToken,
  sanitizeUser,
} from '../utils/auth';
import { SignupRequest, LoginRequest, User } from '../models/types';

export class AuthController {
  // Sign up new user
  async signup(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, full_name, preferred_email, phone_number, linkedin_profile_url } =
        req.body as SignupRequest;

      // Check if user already exists
      const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);

      if (existingUser.rows.length > 0) {
        res.status(400).json({
          error: 'User already exists',
          message: 'An account with this email already exists',
        });
        return;
      }

      // Hash password and generate API token
      const passwordHash = await hashPassword(password);
      const apiToken = generateApiToken();

      // Insert new user
      const result = await query(
        `INSERT INTO users (
          email, password_hash, full_name, preferred_email,
          phone_number, linkedin_profile_url, api_token
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [email, passwordHash, full_name, preferred_email, phone_number, linkedin_profile_url, apiToken]
      );

      const user = result.rows[0] as User;

      // Create default settings
      await query(
        `INSERT INTO user_settings (user_id) VALUES ($1)`,
        [user.id]
      );

      // Create default email template
      const defaultSubject = 'Application for {{job_title}} at {{company_name}}';
      const defaultBody = `Dear {{recruiter_name}},

I hope you are well. I recently applied for the {{job_title}} position at {{company_name}} (Application ID: {{application_id}}) on {{application_date}} via LinkedIn.

I am eager to contribute to your team and would appreciate your consideration for this role. My resume is attached for your review.

Thank you for your time.

Best regards,
{{candidate_name}}
{{candidate_email}}
{{candidate_phone}}`;

      await query(
        `INSERT INTO email_templates (user_id, subject_template, body_template)
        VALUES ($1, $2, $3)`,
        [user.id, defaultSubject, defaultBody]
      );

      // Generate JWT token
      const token = generateToken(user);

      res.status(201).json({
        user: sanitizeUser(user),
        token,
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create account',
      });
    }
  }

  // Login
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body as LoginRequest;

      // Find user by email
      const result = await query('SELECT * FROM users WHERE email = $1', [email]);

      if (result.rows.length === 0) {
        res.status(401).json({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect',
        });
        return;
      }

      const user = result.rows[0] as User;

      // Verify password
      const isPasswordValid = await verifyPassword(password, user.password_hash);

      if (!isPasswordValid) {
        res.status(401).json({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect',
        });
        return;
      }

      // Update last login
      await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

      // Generate JWT token
      const token = generateToken(user);

      res.json({
        user: sanitizeUser(user),
        token,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to login',
      });
    }
  }

  // Get current user
  async me(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;

      const result = await query('SELECT * FROM users WHERE id = $1', [userId]);

      if (result.rows.length === 0) {
        res.status(404).json({
          error: 'Not found',
          message: 'User not found',
        });
        return;
      }

      const user = result.rows[0] as User;

      res.json({
        user: sanitizeUser(user),
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get user',
      });
    }
  }

  // Refresh token
  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;

      const result = await query('SELECT * FROM users WHERE id = $1', [userId]);

      if (result.rows.length === 0) {
        res.status(404).json({
          error: 'Not found',
          message: 'User not found',
        });
        return;
      }

      const user = result.rows[0] as User;
      const token = generateToken(user);

      res.json({ token });
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to refresh token',
      });
    }
  }
}

export const authController = new AuthController();
