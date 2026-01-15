/**
 * Company and People Discovery Service
 * Uses search engine queries to find public profiles
 * ToS-compliant: no login, no CAPTCHA breaking, respects rate limits
 */

import { config } from '../config.js';

export interface SearchResult {
    title: string;
    url: string;
    snippet: string;
}

export interface ParsedLinkedInProfile {
    fullName: string;
    firstName: string;
    lastName: string;
    title: string | null;
    company: string | null;
    location: string | null;
    linkedinUrl: string;
}

export interface DiscoveryOptions {
    roles?: string[];
    geography?: string[];
    seniority?: string[];
    maxResults?: number;
}

/**
 * Generate search queries for finding employees
 */
export function generateSearchQueries(
    companyName: string,
    options: DiscoveryOptions = {}
): string[] {
    const queries: string[] = [];
    const roles = options.roles || [
        'Managing Partner',
        'Principal',
        'Investment Associate',
        'CIO',
        'Chief Investment Officer',
        'Operations',
        'Chief of Staff',
        'CFO',
        'COO'
    ];

    // Generate role-specific LinkedIn queries
    for (const role of roles) {
        queries.push(`"${companyName}" "${role}" site:linkedin.com/in`);
    }

    // General company query
    queries.push(`"${companyName}" family office site:linkedin.com/in`);
    queries.push(`"${companyName}" investment site:linkedin.com/in`);

    // Add geography filters if specified
    if (options.geography && options.geography.length > 0) {
        const geoQueries = [];
        for (const geo of options.geography) {
            geoQueries.push(`"${companyName}" "${geo}" site:linkedin.com/in`);
        }
        queries.push(...geoQueries);
    }

    return queries;
}

/**
 * Parse a LinkedIn profile from search result
 */
export function parseLinkedInResult(result: SearchResult): ParsedLinkedInProfile | null {
    const { title, url, snippet } = result;

    // Validate LinkedIn URL format
    const linkedinMatch = url.match(/linkedin\.com\/in\/([^\/\?]+)/i);
    if (!linkedinMatch) return null;

    // Parse name from title (usually "Name - Title - Company | LinkedIn")
    const titleParts = title.split(' - ');
    if (titleParts.length === 0) return null;

    const fullName = titleParts[0].replace(' | LinkedIn', '').trim();
    const nameParts = fullName.split(' ').filter(p => p.length > 0);

    if (nameParts.length < 2) return null;

    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    // Try to extract title and company
    let personTitle: string | null = null;
    let company: string | null = null;

    if (titleParts.length >= 2) {
        personTitle = titleParts[1].replace(' | LinkedIn', '').trim();
    }
    if (titleParts.length >= 3) {
        company = titleParts[2].replace(' | LinkedIn', '').trim();
    }

    // Try to extract location from snippet
    const locationMatch = snippet.match(/(?:Location|Based in|Located in)[:\s]+([^\.]+)/i);
    const location = locationMatch ? locationMatch[1].trim() : null;

    return {
        fullName,
        firstName,
        lastName,
        title: personTitle,
        company,
        location,
        linkedinUrl: url
    };
}

/**
 * Apply filters to discovered profiles
 */
export function filterProfiles(
    profiles: ParsedLinkedInProfile[],
    companyName: string,
    options: DiscoveryOptions
): ParsedLinkedInProfile[] {
    let filtered = profiles;

    // Filter by company name similarity
    filtered = filtered.filter(p => {
        if (!p.company) return true; // Keep if no company info
        const companyLower = p.company.toLowerCase();
        const targetLower = companyName.toLowerCase();
        return companyLower.includes(targetLower) || targetLower.includes(companyLower);
    });

    // Filter by role keywords
    if (options.roles && options.roles.length > 0) {
        filtered = filtered.filter(p => {
            if (!p.title) return false;
            const titleLower = p.title.toLowerCase();
            return options.roles!.some(role => titleLower.includes(role.toLowerCase()));
        });
    }

    // Filter by geography
    if (options.geography && options.geography.length > 0) {
        filtered = filtered.filter(p => {
            if (!p.location) return true; // Keep if no location info
            const locationLower = p.location.toLowerCase();
            return options.geography!.some(geo => locationLower.includes(geo.toLowerCase()));
        });
    }

    // Deduplicate by name
    const seen = new Set<string>();
    filtered = filtered.filter(p => {
        const key = p.fullName.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    // Limit results
    const maxResults = options.maxResults || config.maxResultsPerSearch;
    return filtered.slice(0, maxResults);
}

/**
 * Determine seniority level from title
 */
export function inferSeniority(title: string | null): string | null {
    if (!title) return null;

    const titleLower = title.toLowerCase();

    // C-Level
    if (/\b(ceo|cfo|cio|cto|coo|chief)\b/i.test(titleLower)) {
        return 'c_level';
    }

    // Partner level
    if (/\b(partner|founder|co-founder)\b/i.test(titleLower)) {
        return 'partner';
    }

    // VP level
    if (/\b(vice president|vp|svp|evp)\b/i.test(titleLower)) {
        return 'vp';
    }

    // Director level
    if (/\b(director|managing director|md)\b/i.test(titleLower)) {
        return 'director';
    }

    // Manager level
    if (/\b(manager|head of|lead)\b/i.test(titleLower)) {
        return 'manager';
    }

    // Analyst level
    if (/\b(analyst|senior analyst)\b/i.test(titleLower)) {
        return 'analyst';
    }

    // Associate level
    if (/\b(associate|principal)\b/i.test(titleLower)) {
        return 'associate';
    }

    return 'other';
}

/**
 * Extract domain from company website URL
 */
export function extractDomain(url: string): string | null {
    try {
        const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
        return parsed.hostname.replace(/^www\./, '');
    } catch {
        return null;
    }
}

/**
 * Generate company domain search query
 */
export function generateDomainSearchQuery(companyName: string): string {
    return `"${companyName}" official website OR homepage`;
}
