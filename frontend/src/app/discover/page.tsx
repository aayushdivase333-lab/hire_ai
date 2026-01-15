'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    Search,
    Target,
    Users,
    Building2,
    CheckCircle,
    Loader2,
    Mail,
    ArrowRight,
    AlertCircle,
    RefreshCw,
    Linkedin,
    Globe,
    Plus,
} from 'lucide-react';
import { discoveryApi, companiesApi, peopleApi } from '@/lib/api';

interface DiscoveredContact {
    id: string;
    fullName: string;
    firstName: string;
    lastName: string;
    title: string;
    linkedinUrl: string;
    selected: boolean;
    email?: string;
    emailConfidence?: string;
}

interface TargetRole {
    id: string;
    label: string;
    keywords: string[];
    selected: boolean;
}

const DEFAULT_ROLES: TargetRole[] = [
    { id: 'partner', label: 'Partner', keywords: ['Partner', 'Managing Partner', 'General Partner'], selected: true },
    { id: 'c_level', label: 'C-Level', keywords: ['CEO', 'CFO', 'CTO', 'COO', 'CIO'], selected: true },
    { id: 'director', label: 'Director', keywords: ['Director', 'Managing Director'], selected: true },
    { id: 'vp', label: 'VP', keywords: ['Vice President', 'VP', 'SVP', 'EVP'], selected: false },
    { id: 'head', label: 'Head/Lead', keywords: ['Head of', 'Lead', 'Principal'], selected: false },
    { id: 'manager', label: 'Manager', keywords: ['Manager', 'Senior Manager'], selected: false },
];

export default function DiscoverPage() {
    const searchParams = useSearchParams();
    const initialCompany = searchParams.get('company') || '';

    const [step, setStep] = useState<'input' | 'searching' | 'results' | 'generating'>('input');
    const [companyName, setCompanyName] = useState(initialCompany);
    const [companyWebsite, setCompanyWebsite] = useState('');
    const [companyDomain, setCompanyDomain] = useState('');
    const [targetRoles, setTargetRoles] = useState<TargetRole[]>(DEFAULT_ROLES);
    const [discoveredContacts, setDiscoveredContacts] = useState<DiscoveredContact[]>([]);
    const [searchProgress, setSearchProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [savedCompanyId, setSavedCompanyId] = useState<string | null>(null);

    useEffect(() => {
        if (initialCompany) {
            setCompanyName(initialCompany);
        }
    }, [initialCompany]);

    const selectedRoles = targetRoles.filter((r) => r.selected);

    function toggleRole(roleId: string) {
        setTargetRoles(
            targetRoles.map((r) => (r.id === roleId ? { ...r, selected: !r.selected } : r))
        );
    }

    async function startDiscovery() {
        if (!companyName.trim()) {
            setError('Please enter a company name');
            return;
        }

        if (selectedRoles.length === 0) {
            setError('Please select at least one target role');
            return;
        }

        setError(null);
        setStep('searching');
        setSearchProgress(0);
        setDiscoveredContacts([]);

        try {
            // Step 1: Create company if needed
            setSearchProgress(10);
            let company;
            const existingCompanies = await companiesApi.list({ search: companyName });

            if (existingCompanies.success && existingCompanies.data.items.length > 0) {
                company = existingCompanies.data.items[0];
            } else {
                const createResult = await companiesApi.create({
                    name: companyName,
                    website_url: companyWebsite || undefined,
                });
                if (createResult.success) {
                    company = createResult.data;
                }
            }

            if (company) {
                setSavedCompanyId(company.id);
                setCompanyDomain(company.domain || '');
            }

            // Step 2: Run discovery via Google search
            setSearchProgress(30);
            const roleKeywords = selectedRoles.flatMap((r) => r.keywords);

            const result = await discoveryApi.autoDiscover(companyName, {
                roles: roleKeywords,
                maxResults: 15,
            });

            setSearchProgress(80);

            if (result.success && result.data.contacts) {
                const contacts: DiscoveredContact[] = result.data.contacts.map((c: any, i: number) => ({
                    id: `discovered-${i}`,
                    fullName: c.fullName,
                    firstName: c.firstName,
                    lastName: c.lastName,
                    title: c.title || 'Unknown',
                    linkedinUrl: c.linkedinUrl || '',
                    selected: true,
                }));
                setDiscoveredContacts(contacts);
            }

            setSearchProgress(100);
            setStep('results');
        } catch (err: any) {
            setError(err.message || 'Discovery failed. Please try again.');
            setStep('input');
        }
    }

    async function saveSelectedContacts() {
        if (!savedCompanyId) {
            setError('Company not found. Please try again.');
            return;
        }

        setStep('generating');
        const selectedContacts = discoveredContacts.filter((c) => c.selected);
        let savedCount = 0;

        for (const contact of selectedContacts) {
            try {
                // Create person
                const createResult = await peopleApi.create({
                    company_id: savedCompanyId,
                    full_name: contact.fullName,
                    first_name: contact.firstName,
                    last_name: contact.lastName,
                    title: contact.title,
                    linkedin_url: contact.linkedinUrl,
                    source: 'discovery',
                });

                if (createResult.success && companyDomain) {
                    // Generate emails
                    await peopleApi.generateEmails(createResult.data.id);
                }

                savedCount++;
            } catch (err) {
                console.error('Failed to save contact:', contact.fullName, err);
            }
        }

        // Redirect to contacts page
        window.location.href = `/contacts?company_id=${savedCompanyId}&saved=${savedCount}`;
    }

    function toggleContact(contactId: string) {
        setDiscoveredContacts(
            discoveredContacts.map((c) =>
                c.id === contactId ? { ...c, selected: !c.selected } : c
            )
        );
    }

    function selectAll() {
        setDiscoveredContacts(discoveredContacts.map((c) => ({ ...c, selected: true })));
    }

    function deselectAll() {
        setDiscoveredContacts(discoveredContacts.map((c) => ({ ...c, selected: false })));
    }

    const selectedCount = discoveredContacts.filter((c) => c.selected).length;

    return (
        <div className="container">
            {/* Header */}
            <div className="page-header">
                <h1 className="page-title">
                    <Target size={28} style={{ color: 'var(--accent-primary)' }} />
                    Lead Discovery
                </h1>
                <p className="page-subtitle">
                    Enter a company name and we'll automatically find 10-15 key contacts with their emails
                </p>
            </div>

            {/* Error Message */}
            {error && (
                <div
                    style={{
                        padding: 'var(--spacing-md)',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: 'var(--spacing-lg)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-sm)',
                    }}
                >
                    <AlertCircle size={20} style={{ color: 'var(--accent-danger)' }} />
                    <span style={{ color: 'var(--accent-danger)' }}>{error}</span>
                </div>
            )}

            {/* Step: Input */}
            {step === 'input' && (
                <div className="card" style={{ maxWidth: '700px' }}>
                    {/* Company Input */}
                    <div className="form-group">
                        <label className="form-label required">Company Name</label>
                        <div style={{ position: 'relative' }}>
                            <Building2
                                size={18}
                                style={{
                                    position: 'absolute',
                                    left: '14px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'var(--text-muted)',
                                }}
                            />
                            <input
                                type="text"
                                className="form-input"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                placeholder="e.g., Blackstone, Citadel, Apollo Global"
                                style={{ paddingLeft: '44px', fontSize: '1.125rem' }}
                            />
                        </div>
                    </div>

                    {/* Website (Optional) */}
                    <div className="form-group">
                        <label className="form-label">Company Website (optional)</label>
                        <div style={{ position: 'relative' }}>
                            <Globe
                                size={18}
                                style={{
                                    position: 'absolute',
                                    left: '14px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'var(--text-muted)',
                                }}
                            />
                            <input
                                type="url"
                                className="form-input"
                                value={companyWebsite}
                                onChange={(e) => setCompanyWebsite(e.target.value)}
                                placeholder="https://example.com"
                                style={{ paddingLeft: '44px' }}
                            />
                        </div>
                        <p className="form-help">
                            We'll use this to generate email addresses (e.g., first.last@company.com)
                        </p>
                    </div>

                    {/* Target Roles */}
                    <div className="form-group">
                        <label className="form-label required">Target Roles</label>
                        <p className="form-help" style={{ marginBottom: 'var(--spacing-md)' }}>
                            Select which types of employees you want to find
                        </p>
                        <div className="form-checkbox-group">
                            {targetRoles.map((role) => (
                                <label
                                    key={role.id}
                                    className={`form-checkbox-item ${role.selected ? 'selected' : ''}`}
                                    onClick={() => toggleRole(role.id)}
                                >
                                    <input type="checkbox" checked={role.selected} readOnly />
                                    {role.label}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Start Button */}
                    <button
                        className="btn btn-primary btn-lg"
                        onClick={startDiscovery}
                        disabled={!companyName.trim() || selectedRoles.length === 0}
                        style={{ width: '100%', marginTop: 'var(--spacing-md)' }}
                    >
                        <Search size={20} />
                        Start Discovery
                        <ArrowRight size={20} />
                    </button>

                    {/* Info Box */}
                    <div
                        style={{
                            marginTop: 'var(--spacing-lg)',
                            padding: 'var(--spacing-md)',
                            background: 'var(--bg-tertiary)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.875rem',
                            color: 'var(--text-muted)',
                        }}
                    >
                        <strong style={{ color: 'var(--text-secondary)' }}>How it works:</strong>
                        <ol style={{ marginTop: 'var(--spacing-sm)', paddingLeft: 'var(--spacing-lg)' }}>
                            <li>We search Google for LinkedIn profiles at this company</li>
                            <li>Extract names and titles from public search results</li>
                            <li>Generate possible email addresses based on common patterns</li>
                            <li>You review and approve before any emails are sent</li>
                        </ol>
                    </div>
                </div>
            )}

            {/* Step: Searching */}
            {step === 'searching' && (
                <div className="card" style={{ maxWidth: '600px', textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <Loader2
                            size={48}
                            style={{ color: 'var(--accent-primary)', animation: 'spin 1s linear infinite' }}
                        />
                    </div>
                    <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>Discovering contacts at {companyName}</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--spacing-lg)' }}>
                        Searching public records for {selectedRoles.map((r) => r.label).join(', ')}...
                    </p>
                    <div className="progress-bar" style={{ marginBottom: 'var(--spacing-sm)' }}>
                        <div className="progress-bar-fill" style={{ width: `${searchProgress}%` }} />
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{searchProgress}%</p>
                </div>
            )}

            {/* Step: Results */}
            {step === 'results' && (
                <div style={{ display: 'grid', gap: 'var(--spacing-lg)' }}>
                    {/* Results Header */}
                    <div className="card" style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, var(--bg-card) 50%)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                <div
                                    style={{
                                        width: 56,
                                        height: 56,
                                        borderRadius: 'var(--radius-lg)',
                                        background: 'var(--accent-success)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <CheckCircle size={28} style={{ color: 'white' }} />
                                </div>
                                <div>
                                    <h3 style={{ marginBottom: '4px' }}>Found {discoveredContacts.length} contacts at {companyName}</h3>
                                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                                        {companyDomain ? (
                                            <>Emails will be generated with @{companyDomain}</>
                                        ) : (
                                            <>Add a company website to generate emails</>
                                        )}
                                    </p>
                                </div>
                            </div>
                            <button className="btn btn-secondary" onClick={() => setStep('input')}>
                                <RefreshCw size={18} />
                                New Search
                            </button>
                        </div>
                    </div>

                    {/* Selection Controls */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                            <button className="btn btn-ghost btn-sm" onClick={selectAll}>
                                Select All
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={deselectAll}>
                                Deselect All
                            </button>
                        </div>
                        <span style={{ color: 'var(--text-muted)' }}>
                            {selectedCount} of {discoveredContacts.length} selected
                        </span>
                    </div>

                    {/* Contacts List */}
                    <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
                        {discoveredContacts.map((contact) => (
                            <div
                                key={contact.id}
                                className={`discovery-result ${contact.selected ? 'selected' : ''}`}
                                onClick={() => toggleContact(contact.id)}
                            >
                                <div className={`discovery-result-checkbox ${contact.selected ? 'checked' : ''}`}>
                                    {contact.selected && <CheckCircle size={14} style={{ color: 'white' }} />}
                                </div>
                                <div
                                    style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 'var(--radius-full)',
                                        background: 'var(--accent-primary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontWeight: 600,
                                    }}
                                >
                                    {contact.firstName?.[0]}
                                    {contact.lastName?.[0]}
                                </div>
                                <div className="discovery-result-info">
                                    <div className="discovery-result-name">{contact.fullName}</div>
                                    <div className="discovery-result-title">{contact.title}</div>
                                </div>
                                {contact.linkedinUrl && (
                                    <a
                                        href={contact.linkedinUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ color: 'var(--accent-info)' }}
                                    >
                                        <Linkedin size={20} />
                                    </a>
                                )}
                                {companyDomain && (
                                    <span className="badge badge-success">
                                        <Mail size={12} />
                                        Email Ready
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" onClick={() => setStep('input')}>
                            Cancel
                        </button>
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={saveSelectedContacts}
                            disabled={selectedCount === 0}
                        >
                            <Plus size={18} />
                            Add {selectedCount} Contacts & Generate Emails
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Step: Generating */}
            {step === 'generating' && (
                <div className="card" style={{ maxWidth: '600px', textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <Mail size={48} style={{ color: 'var(--accent-primary)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                    </div>
                    <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>Saving contacts & generating emails</h3>
                    <p style={{ color: 'var(--text-muted)' }}>
                        Creating contact records and generating email candidates...
                    </p>
                    <div className="spinner-lg" style={{ margin: 'var(--spacing-lg) auto' }} />
                </div>
            )}
        </div>
    );
}
