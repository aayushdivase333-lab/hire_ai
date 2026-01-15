import nodemailer from 'nodemailer';
import { config } from '../config.js';

export interface EmailOptions {
    to: string;
    subject: string;
    text: string;
    html?: string;
    replyTo?: string;
}

export interface SendResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

// Create transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        auth: {
            user: config.smtp.user,
            pass: config.smtp.pass,
        },
    });
};

let transporter: nodemailer.Transporter | null = null;

/**
 * Get or create email transporter
 */
function getTransporter(): nodemailer.Transporter {
    if (!transporter) {
        transporter = createTransporter();
    }
    return transporter;
}

/**
 * Verify SMTP connection
 */
export async function verifyConnection(): Promise<boolean> {
    try {
        await getTransporter().verify();
        return true;
    } catch (error) {
        console.error('SMTP connection failed:', error);
        return false;
    }
}

/**
 * Send an email
 */
export async function sendEmail(options: EmailOptions): Promise<SendResult> {
    try {
        const info = await getTransporter().sendMail({
            from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html || options.text.replace(/\n/g, '<br>'),
            replyTo: options.replyTo || config.smtp.fromEmail,
        });

        return {
            success: true,
            messageId: info.messageId,
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Failed to send email',
        };
    }
}

/**
 * Template variable replacement
 */
export function renderTemplate(
    template: string,
    variables: Record<string, string>
): string {
    let result = template;

    for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
        result = result.replace(regex, value);
    }

    return result;
}

/**
 * Generate email variables for a person
 */
export function generateTemplateVariables(
    person: {
        firstName: string;
        lastName: string;
        fullName: string;
        title: string | null;
    },
    company: {
        name: string;
    }
): Record<string, string> {
    return {
        first_name: person.firstName,
        last_name: person.lastName,
        full_name: person.fullName,
        company_name: company.name,
        role: person.title || 'your role',
        my_name: config.myName,
        my_service_summary: config.myServiceSummary,
        opt_out_text: 'If this is not relevant, reply with "no" and I will remove you.',
    };
}

/**
 * Convert plain text to simple HTML
 */
export function textToHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>');
}
