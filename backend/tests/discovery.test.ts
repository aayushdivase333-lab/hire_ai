import { describe, it, expect } from 'vitest';
import {
    generateSearchQueries,
    parseLinkedInResult,
    filterProfiles,
    inferSeniority,
    extractDomain,
} from '../src/services/discovery.js';

describe('Discovery Service', () => {
    describe('generateSearchQueries', () => {
        it('should generate LinkedIn search queries for company', () => {
            const queries = generateSearchQueries('Acme Capital');

            expect(queries.length).toBeGreaterThan(0);
            expect(queries.every(q => q.includes('site:linkedin.com/in'))).toBe(true);
            expect(queries.some(q => q.includes('Acme Capital'))).toBe(true);
        });

        it('should include role-specific queries', () => {
            const queries = generateSearchQueries('Acme Capital', {
                roles: ['Managing Partner', 'CFO'],
            });

            expect(queries.some(q => q.includes('Managing Partner'))).toBe(true);
            expect(queries.some(q => q.includes('CFO'))).toBe(true);
        });
    });

    describe('parseLinkedInResult', () => {
        it('should parse LinkedIn search result correctly', () => {
            const result = {
                title: 'John Smith - Managing Partner - Acme Capital | LinkedIn',
                url: 'https://www.linkedin.com/in/johnsmith',
                snippet: 'Based in New York. Managing partner at Acme Capital.',
            };

            const parsed = parseLinkedInResult(result);

            expect(parsed).not.toBeNull();
            expect(parsed?.fullName).toBe('John Smith');
            expect(parsed?.firstName).toBe('John');
            expect(parsed?.lastName).toBe('Smith');
            expect(parsed?.title).toBe('Managing Partner');
        });

        it('should return null for non-LinkedIn URLs', () => {
            const result = {
                title: 'John Smith - Example.com',
                url: 'https://example.com/john',
                snippet: '',
            };

            expect(parseLinkedInResult(result)).toBeNull();
        });
    });

    describe('inferSeniority', () => {
        it('should identify C-level executives', () => {
            expect(inferSeniority('CEO')).toBe('c_level');
            expect(inferSeniority('Chief Financial Officer')).toBe('c_level');
            expect(inferSeniority('Co-Founder & CEO')).toBe('c_level');
        });

        it('should identify partners', () => {
            expect(inferSeniority('Managing Partner')).toBe('partner');
            expect(inferSeniority('General Partner')).toBe('partner');
            expect(inferSeniority('Founder')).toBe('partner');
        });

        it('should identify VP level', () => {
            expect(inferSeniority('Vice President')).toBe('vp');
            expect(inferSeniority('SVP of Operations')).toBe('vp');
        });

        it('should return null for unknown titles', () => {
            expect(inferSeniority(null)).toBeNull();
            expect(inferSeniority('')).toBeNull();
        });
    });

    describe('extractDomain', () => {
        it('should extract domain from URL', () => {
            expect(extractDomain('https://www.example.com')).toBe('example.com');
            expect(extractDomain('http://example.com/page')).toBe('example.com');
        });

        it('should handle URLs without protocol', () => {
            expect(extractDomain('www.example.com')).toBe('example.com');
            expect(extractDomain('example.com')).toBe('example.com');
        });

        it('should return null for invalid URLs', () => {
            expect(extractDomain('')).toBeNull();
        });
    });

    describe('filterProfiles', () => {
        it('should filter by company name', () => {
            const profiles = [
                { fullName: 'John Smith', company: 'Acme Capital', firstName: 'John', lastName: 'Smith', title: null, location: null, linkedinUrl: '' },
                { fullName: 'Jane Doe', company: 'Other Corp', firstName: 'Jane', lastName: 'Doe', title: null, location: null, linkedinUrl: '' },
            ];

            const filtered = filterProfiles(profiles, 'Acme Capital', {});
            expect(filtered.length).toBe(1);
            expect(filtered[0].fullName).toBe('John Smith');
        });

        it('should deduplicate by name', () => {
            const profiles = [
                { fullName: 'John Smith', company: 'Acme', firstName: 'John', lastName: 'Smith', title: null, location: null, linkedinUrl: '' },
                { fullName: 'John Smith', company: 'Acme', firstName: 'John', lastName: 'Smith', title: null, location: null, linkedinUrl: '' },
            ];

            const filtered = filterProfiles(profiles, 'Acme', {});
            expect(filtered.length).toBe(1);
        });
    });
});
