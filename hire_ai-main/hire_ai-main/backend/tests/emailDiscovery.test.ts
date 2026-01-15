import { describe, it, expect } from 'vitest';
import {
    generateEmailCandidates,
    checkMxRecords,
    selectBestEmail,
} from '../src/services/emailDiscovery.js';

describe('Email Discovery', () => {
    describe('generateEmailCandidates', () => {
        it('should generate multiple email candidates from name and domain', () => {
            const candidates = generateEmailCandidates('John', 'Smith', 'example.com');

            expect(candidates.length).toBeGreaterThan(0);
            expect(candidates.some(c => c.email === 'john.smith@example.com')).toBe(true);
            expect(candidates.some(c => c.email === 'jsmith@example.com')).toBe(true);
            expect(candidates.some(c => c.email === 'john@example.com')).toBe(true);
        });

        it('should normalize names with accents', () => {
            const candidates = generateEmailCandidates('José', 'García', 'example.com');

            expect(candidates.some(c => c.email === 'jose.garcia@example.com')).toBe(true);
        });

        it('should assign higher confidence to common patterns', () => {
            const candidates = generateEmailCandidates('John', 'Smith', 'example.com');

            const firstLastDot = candidates.find(c => c.pattern === 'firstname.lastname');
            const lastOnly = candidates.find(c => c.pattern === 'lastname');

            expect(firstLastDot?.confidence).toBe('high');
            expect(lastOnly?.confidence).toBe('low');
        });

        it('should return empty array for missing inputs', () => {
            expect(generateEmailCandidates('', 'Smith', 'example.com')).toEqual([]);
            expect(generateEmailCandidates('John', '', 'example.com')).toEqual([]);
            expect(generateEmailCandidates('John', 'Smith', '')).toEqual([]);
        });
    });

    describe('selectBestEmail', () => {
        it('should prefer high confidence emails', () => {
            const candidates = [
                { email: 'low@example.com', confidence: 'low' as const },
                { email: 'high@example.com', confidence: 'high' as const },
                { email: 'medium@example.com', confidence: 'medium' as const },
            ];

            const result = selectBestEmail(candidates);
            expect(result?.email).toBe('high@example.com');
        });

        it('should prefer validated emails over high confidence', () => {
            const candidates = [
                { email: 'high@example.com', confidence: 'high' as const },
                { email: 'validated@example.com', confidence: 'medium' as const, validated: true },
            ];

            const result = selectBestEmail(candidates);
            expect(result?.email).toBe('validated@example.com');
        });

        it('should return null for empty array', () => {
            expect(selectBestEmail([])).toBeNull();
        });
    });

    describe('checkMxRecords', () => {
        it('should return valid=true for existing domain', async () => {
            const result = await checkMxRecords('gmail.com');
            expect(result.valid).toBe(true);
            expect(result.records.length).toBeGreaterThan(0);
        });

        it('should return valid=false for non-existent domain', async () => {
            const result = await checkMxRecords('this-domain-does-not-exist-12345.com');
            expect(result.valid).toBe(false);
        });
    });
});
