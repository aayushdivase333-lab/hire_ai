import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

// Generic validation middleware factory
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details: Record<string, string> = {};
      error.details.forEach((detail) => {
        const key = detail.path.join('.');
        details[key] = detail.message;
      });

      res.status(400).json({
        error: 'Validation failed',
        details,
      });
      return;
    }

    req.body = value;
    next();
  };
};

// Validation schemas
export const signupSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  full_name: Joi.string().min(2).max(255).required(),
  preferred_email: Joi.string().email().required(),
  phone_number: Joi.string().optional().allow(''),
  linkedin_profile_url: Joi.string().uri().optional().allow(''),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const updateProfileSchema = Joi.object({
  full_name: Joi.string().min(2).max(255).optional(),
  phone_number: Joi.string().optional().allow(''),
  linkedin_profile_url: Joi.string().uri().optional().allow(''),
  preferred_email: Joi.string().email().optional(),
});

export const emailTemplateSchema = Joi.object({
  subject_template: Joi.string().min(1).max(500).required(),
  body_template: Joi.string().min(1).max(5000).required(),
});

export const applicationSchema = Joi.object({
  job_title: Joi.string().required(),
  company_name: Joi.string().required(),
  location: Joi.string().optional().allow(''),
  application_date: Joi.string().isoDate().required(),
  application_id: Joi.string().optional().allow(''),
  job_link: Joi.string().uri().optional().allow(''),
  job_description: Joi.string().optional().allow(''),
  recruiter_name: Joi.string().optional().allow(''),
  recruiter_email: Joi.string().email().optional().allow(''),
  linkedin_application_id: Joi.string().optional().allow(''),
  raw_data: Joi.object().optional(),
});

export const syncApplicationsSchema = Joi.object({
  applications: Joi.array().items(applicationSchema).min(1).required(),
});

export const sendEmailSchema = Joi.object({
  application_ids: Joi.array().items(Joi.string().uuid()).min(1).required(),
  force: Joi.boolean().optional(),
});

export const updateApplicationSchema = Joi.object({
  recruiter_name: Joi.string().optional().allow(''),
  recruiter_email: Joi.string().email().optional().allow(''),
  status: Joi.string()
    .valid('pending', 'email_sent', 'failed', 'no_contact_found', 'manual_review')
    .optional(),
});

export const settingsSchema = Joi.object({
  auto_send_enabled: Joi.boolean().optional(),
  require_manual_approval: Joi.boolean().optional(),
  max_emails_per_day: Joi.number().integer().min(1).max(100).optional(),
  email_rate_limit_minutes: Joi.number().integer().min(1).max(60).optional(),
});

export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});
