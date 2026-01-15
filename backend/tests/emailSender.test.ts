import { describe, it, expect } from 'vitest';
import { renderTemplate, generateTemplateVariables } from '../src/services/emailSender.js';

describe('Email Sender', () => {
    describe('renderTemplate', () => {
        it('should replace variables in template', () => {
            const template = 'Hello {{first_name}}, welcome to {{company_name}}!';
            const variables = {
                first_name: 'John',
                company_name: 'Acme Corp',
            };

            const result = renderTemplate(template, variables);
            expect(result).toBe('Hello John, welcome to Acme Corp!');
        });

        it('should handle multiple occurrences of same variable', () => {
            const template = '{{name}} said hello to {{name}}';
            const variables = { name: 'John' };

            const result = renderTemplate(template, variables);
            expect(result).toBe('John said hello to John');
        });

        it('should handle spaces in variable syntax', () => {
            const template = 'Hello {{ first_name }}!';
            const variables = { first_name: 'John' };

            const result = renderTemplate(template, variables);
            expect(result).toBe('Hello John!');
        });

        it('should leave unmatched variables unchanged', () => {
            const template = 'Hello {{first_name}}!';
            const variables = {};

            const result = renderTemplate(template, variables);
            expect(result).toBe('Hello {{first_name}}!');
        });
    });

    describe('generateTemplateVariables', () => {
        it('should generate all required variables', () => {
            const person = {
                firstName: 'John',
                lastName: 'Smith',
                fullName: 'John Smith',
                title: 'Managing Partner',
            };
            const company = { name: 'Acme Capital' };

            const variables = generateTemplateVariables(person, company);

            expect(variables.first_name).toBe('John');
            expect(variables.last_name).toBe('Smith');
            expect(variables.full_name).toBe('John Smith');
            expect(variables.company_name).toBe('Acme Capital');
            expect(variables.role).toBe('Managing Partner');
            expect(variables.opt_out_text).toContain('reply with "no"');
        });

        it('should use fallback for missing title', () => {
            const person = {
                firstName: 'John',
                lastName: 'Smith',
                fullName: 'John Smith',
                title: null,
            };
            const company = { name: 'Acme' };

            const variables = generateTemplateVariables(person, company);
            expect(variables.role).toBe('your role');
        });
    });
});
