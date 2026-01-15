import nodemailer, { Transporter } from 'nodemailer';
import { JobApplication, User, EmailTemplate, Resume } from '../models/types';
import fs from 'fs/promises';
import path from 'path';

export interface EmailPlaceholders {
  recruiter_name: string;
  company_name: string;
  job_title: string;
  job_location: string;
  application_id: string;
  application_date: string;
  job_link: string;
  candidate_name: string;
  candidate_email: string;
  candidate_phone: string;
}

export class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // Verify email configuration
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('Email service ready');
      return true;
    } catch (error) {
      console.error('Email service verification failed:', error);
      return false;
    }
  }

  // Fill template placeholders
  private fillTemplate(template: string, placeholders: EmailPlaceholders): string {
    let result = template;

    Object.entries(placeholders).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), value || '');
    });

    return result;
  }

  // Build placeholders from application and user data
  buildPlaceholders(
    application: JobApplication,
    user: User
  ): EmailPlaceholders {
    return {
      recruiter_name: application.recruiter_name || 'Hiring Manager',
      company_name: application.company_name,
      job_title: application.job_title,
      job_location: application.location || 'Not specified',
      application_id: application.application_id || application.id,
      application_date: new Date(application.application_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      job_link: application.job_link || '',
      candidate_name: user.full_name,
      candidate_email: user.preferred_email,
      candidate_phone: user.phone_number || '',
    };
  }

  // Generate email content from template
  generateEmailContent(
    template: EmailTemplate,
    placeholders: EmailPlaceholders
  ): { subject: string; body: string } {
    return {
      subject: this.fillTemplate(template.subject_template, placeholders),
      body: this.fillTemplate(template.body_template, placeholders),
    };
  }

  // Send email with resume attachment
  async sendEmail(
    recipientEmail: string,
    subject: string,
    body: string,
    senderEmail: string,
    senderName: string,
    resume?: Resume
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const mailOptions: any = {
        from: `${senderName} <${senderEmail}>`,
        to: recipientEmail,
        subject: subject,
        text: body,
        html: body.replace(/\n/g, '<br>'),
      };

      // Attach resume if provided
      if (resume) {
        try {
          const resumePath = path.resolve(resume.file_path);
          const fileExists = await fs.access(resumePath).then(() => true).catch(() => false);

          if (fileExists) {
            mailOptions.attachments = [
              {
                filename: resume.file_name,
                path: resumePath,
                contentType: resume.mime_type,
              },
            ];
          } else {
            console.warn(`Resume file not found: ${resumePath}`);
          }
        } catch (error) {
          console.error('Error attaching resume:', error);
        }
      }

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);

      return { success: true };
    } catch (error: any) {
      console.error('Failed to send email:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }
  }

  // Preview email without sending
  previewEmail(
    template: EmailTemplate,
    placeholders: EmailPlaceholders
  ): { subject: string; body: string } {
    return this.generateEmailContent(template, placeholders);
  }
}

// Export singleton instance
export const emailService = new EmailService();
