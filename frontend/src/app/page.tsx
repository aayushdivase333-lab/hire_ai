'use client';

import { useState, useEffect } from 'react';
import {
    Briefcase,
    Globe,
    Zap,
    ArrowRight,
    Building2,
    Users,
    Send,
    History,
    Settings,
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    Loader2,
    Mail,
    Paperclip,
    Eye,
    AlertCircle,
    Search,
    MapPin,
    Filter,
    RefreshCw,
    FileText,
    Download,
    X,
} from 'lucide-react';

// Types
interface UserProfile {
    fullName: string;
    role: string;
    bio: string;
    linkedinUrl: string;
    portfolioUrl: string;
    resumePath: string;
    email: string;
}

interface EmailPurpose {
    id: 'job_referral' | 'personal_website' | 'automation';
    title: string;
    description: string;
    icon: any;
    attachment: 'resume' | 'portfolio' | 'case_study';
}

interface FoundPerson {
    id: string;
    fullName: string;
    firstName: string;
    lastName: string;
    title: string;
    company: string;
    location: string;
    linkedinUrl: string;
    email: string;
    emailConfidence: 'high' | 'medium' | 'low' | 'generic';
    selected: boolean;
}

interface EmailPreview {
    personId: string;
    to: string;
    subject: string;
    body: string;
    attachment: string;
}

// Email purposes configuration
const EMAIL_PURPOSES: EmailPurpose[] = [
    {
        id: 'job_referral',
        title: 'Job Referral',
        description: 'Ask for a referral or short chat about a role at their company',
        icon: Briefcase,
        attachment: 'resume',
    },
    {
        id: 'personal_website',
        title: 'Personal Website',
        description: 'Offer to build or improve their personal website',
        icon: Globe,
        attachment: 'portfolio',
    },
    {
        id: 'automation',
        title: 'Automation & Dashboards',
        description: 'Offer to automate their repetitive tasks or build dashboards',
        icon: Zap,
        attachment: 'case_study',
    },
];

// Email templates
const EMAIL_TEMPLATES: Record<string, { subject: string; body: string }> = {
    job_referral: {
        subject: 'Quick question about {{company_name}}',
        body: `Hi {{first_name}},

I came across your profile and noticed you're a {{role}} at {{company_name}}. I'm {{my_name}}, a {{my_title}}, and I'm very interested in opportunities at {{company_name}}.

I respect your time, so I'll keep this brief:
• I have experience in [relevant skill/experience]
• I'm particularly interested in [team/role type] roles
• I think my background in [specific strength] could add value

Would you be open to a 10-minute chat, or if easier, could you refer me through your internal system? I've attached my resume for reference.

Either way, thank you for reading this.

Best regards,
{{my_name}}
{{my_linkedin_url}}

P.S. If this isn't relevant to you, just reply with "no" and I won't follow up.`,
    },
    personal_website: {
        subject: 'Your online presence, {{first_name}}',
        body: `Hi {{first_name}},

I'm {{my_name}}, and I help professionals like yourself create strong personal websites.

In this generation, people judge trust and credibility from someone's online presence—whether it's clients, employers, or partners. A sharp personal website makes a powerful first impression.

I noticed you're a {{role}} at {{company_name}}, and I think a well-crafted personal site could:
• Showcase your expertise and achievements
• Build credibility with new contacts
• Create a lasting impression beyond LinkedIn

I keep things simple: clean design, fast loading, easy to maintain.

Would you like to see some examples? Check out my portfolio: {{my_portfolio_url}}

Happy to jump on a quick call if you're interested.

Best,
{{my_name}}
{{my_linkedin_url}}

P.S. If this isn't relevant, just reply with "no" and I won't follow up.`,
    },
    automation: {
        subject: 'Automating the boring stuff at {{company_name}}',
        body: `Hi {{first_name}},

I'm {{my_name}}, and I build small, useful automations and dashboards for busy professionals.

As a {{role}}, you probably deal with some repetitive work—things like:
• Manual reports that take hours to compile
• Tracking updates across spreadsheets
• Repetitive data entry or status updates

I help people replace that manual work with simple tools that save hours every week. No complex systems—just practical solutions that work.

Would it be worth a 15-minute call to see what's worth automating in your workflow?

Check out my portfolio: {{my_portfolio_url}}

Best,
{{my_name}}
{{my_linkedin_url}}

P.S. If this isn't relevant, just reply with "no" and I won't follow up.`,
    },
};

// Default profile
const DEFAULT_PROFILE: UserProfile = {
    fullName: '',
    role: '',
    bio: '',
    linkedinUrl: '',
    portfolioUrl: '',
    resumePath: '',
    email: '',
};

export default function OutreachWizard() {
    // Wizard state
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

    // Step 1: Purpose
    const [selectedPurpose, setSelectedPurpose] = useState<EmailPurpose | null>(null);

    // Step 2: Company & Filters
    const [companyName, setCompanyName] = useState('');
    const [companyWebsite, setCompanyWebsite] = useState('');
    const [titleFilter, setTitleFilter] = useState('Partner, Director, Head of, Manager');
    const [seniorityFilter, setSeniorityFilter] = useState('Director+');
    const [locationFilter, setLocationFilter] = useState('');
    const [maxContacts, setMaxContacts] = useState(10);

    // Step 3: People & Preview
    const [foundPeople, setFoundPeople] = useState<FoundPerson[]>([]);
    const [emailPreviews, setEmailPreviews] = useState<Map<string, EmailPreview>>(new Map());
    const [previewingPerson, setPreviewingPerson] = useState<FoundPerson | null>(null);
    const [editingEmail, setEditingEmail] = useState<EmailPreview | null>(null);

    // Step 4: History
    const [outreachHistory, setOutreachHistory] = useState<any[]>([]);

    // User profile
    const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
    const [showSettings, setShowSettings] = useState(false);

    // Loading states
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [sendProgress, setSendProgress] = useState({ current: 0, total: 0 });

    // Toast
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Load profile from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('outreach_profile');
        if (stored) {
            setProfile(JSON.parse(stored));
        }
    }, []);

    // Save profile
    function saveProfile() {
        localStorage.setItem('outreach_profile', JSON.stringify(profile));
        setShowSettings(false);
        setToast({ message: 'Profile saved', type: 'success' });
    }

    // Toast auto-hide
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    // Find people (Step 2 → Step 3)
    async function findPeople() {
        if (!companyName.trim()) {
            setToast({ message: 'Please enter a company name', type: 'error' });
            return;
        }

        setLoading(true);
        try {
            // Call discovery API
            const response = await fetch('/api/discovery/auto', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyName,
                    roles: titleFilter.split(',').map(r => r.trim()),
                    maxResults: maxContacts,
                }),
            });

            const result = await response.json();

            if (result.success && result.data.contacts) {
                const people: FoundPerson[] = result.data.contacts.map((c: any, i: number) => ({
                    id: `person-${i}`,
                    fullName: c.fullName,
                    firstName: c.firstName,
                    lastName: c.lastName,
                    title: c.title,
                    company: companyName,
                    location: locationFilter || 'Not specified',
                    linkedinUrl: c.linkedinUrl || '',
                    email: generateEmail(c.firstName, c.lastName, companyWebsite || companyName),
                    emailConfidence: 'medium' as const,
                    selected: true,
                }));

                setFoundPeople(people);
                generateEmailPreviews(people);
                setStep(3);
            } else {
                setToast({ message: result.error || 'Discovery failed', type: 'error' });
            }
        } catch (error: any) {
            setToast({ message: error.message || 'Discovery failed', type: 'error' });
        } finally {
            setLoading(false);
        }
    }

    // Generate email from name + domain
    function generateEmail(firstName: string, lastName: string, domain: string): string {
        const cleanDomain = domain.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
        return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${cleanDomain}.com`;
    }

    // Generate email previews for all people
    function generateEmailPreviews(people: FoundPerson[]) {
        const template = EMAIL_TEMPLATES[selectedPurpose?.id || 'job_referral'];
        const previews = new Map<string, EmailPreview>();

        for (const person of people) {
            const subject = fillTemplate(template.subject, person);
            const body = fillTemplate(template.body, person);
            const attachment = getAttachmentName(selectedPurpose?.attachment || 'resume');

            previews.set(person.id, {
                personId: person.id,
                to: person.email,
                subject,
                body,
                attachment,
            });
        }

        setEmailPreviews(previews);
    }

    // Fill template with variables
    function fillTemplate(template: string, person: FoundPerson): string {
        return template
            .replace(/\{\{first_name\}\}/g, person.firstName)
            .replace(/\{\{last_name\}\}/g, person.lastName)
            .replace(/\{\{full_name\}\}/g, person.fullName)
            .replace(/\{\{role\}\}/g, person.title)
            .replace(/\{\{company_name\}\}/g, person.company)
            .replace(/\{\{my_name\}\}/g, profile.fullName || 'Your Name')
            .replace(/\{\{my_title\}\}/g, profile.role || 'Your Role')
            .replace(/\{\{my_portfolio_url\}\}/g, profile.portfolioUrl || 'yourportfolio.com')
            .replace(/\{\{my_linkedin_url\}\}/g, profile.linkedinUrl || 'linkedin.com/in/you');
    }

    // Get attachment name
    function getAttachmentName(type: string): string {
        switch (type) {
            case 'resume':
                return profile.resumePath || 'resume.pdf';
            case 'portfolio':
                return 'portfolio.pdf';
            case 'case_study':
                return 'case_study.pdf';
            default:
                return '';
        }
    }

    // Toggle person selection
    function togglePerson(personId: string) {
        setFoundPeople(
            foundPeople.map((p) =>
                p.id === personId ? { ...p, selected: !p.selected } : p
            )
        );
    }

    // Update email preview
    function updateEmailPreview(personId: string, field: 'subject' | 'body', value: string) {
        const preview = emailPreviews.get(personId);
        if (preview) {
            emailPreviews.set(personId, { ...preview, [field]: value });
            setEmailPreviews(new Map(emailPreviews));
        }
    }

    // Send emails
    async function sendEmails() {
        const selectedPeople = foundPeople.filter((p) => p.selected);
        if (selectedPeople.length === 0) {
            setToast({ message: 'Select at least one person', type: 'error' });
            return;
        }

        setSending(true);
        setSendProgress({ current: 0, total: selectedPeople.length });

        const results = [];

        for (let i = 0; i < selectedPeople.length; i++) {
            const person = selectedPeople[i];
            const preview = emailPreviews.get(person.id);

            if (!preview) continue;

            try {
                // Simulate sending (replace with actual API call)
                await new Promise((resolve) => setTimeout(resolve, 1000));

                results.push({
                    personId: person.id,
                    name: person.fullName,
                    email: person.email,
                    status: 'sent',
                    timestamp: new Date().toISOString(),
                });

                setSendProgress({ current: i + 1, total: selectedPeople.length });
            } catch (error) {
                results.push({
                    personId: person.id,
                    name: person.fullName,
                    email: person.email,
                    status: 'error',
                    error: (error as any).message,
                });
            }
        }

        // Save to history
        const campaign = {
            id: `campaign-${Date.now()}`,
            purpose: selectedPurpose?.title,
            company: companyName,
            date: new Date().toISOString(),
            contacts: results,
            sentCount: results.filter((r) => r.status === 'sent').length,
            totalCount: results.length,
        };

        setOutreachHistory([campaign, ...outreachHistory]);
        localStorage.setItem('outreach_history', JSON.stringify([campaign, ...outreachHistory]));

        setSending(false);
        setToast({ message: `Sent ${results.filter((r) => r.status === 'sent').length} emails!`, type: 'success' });
        setStep(4);
    }

    // Check if profile is complete
    function isProfileComplete(): boolean {
        return !!(profile.fullName && profile.role && profile.email);
    }

    // Render step indicators
    function renderStepIndicator() {
        const steps = [
            { num: 1, label: 'Purpose' },
            { num: 2, label: 'Company' },
            { num: 3, label: 'Review' },
            { num: 4, label: 'History' },
        ];

        return (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--spacing-xl)' }}>
                {steps.map((s, i) => (
                    <div key={s.num} style={{ display: 'flex', alignItems: 'center' }}>
                        <div
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                background: step >= s.num ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                color: step >= s.num ? 'white' : 'var(--text-muted)',
                                cursor: step > s.num ? 'pointer' : 'default',
                            }}
                            onClick={() => step > s.num && setStep(s.num as 1 | 2 | 3 | 4)}
                        >
                            {step > s.num ? <CheckCircle size={18} /> : s.num}
                        </div>
                        <span
                            style={{
                                marginLeft: 8,
                                marginRight: 16,
                                fontSize: '0.875rem',
                                color: step === s.num ? 'var(--text-primary)' : 'var(--text-muted)',
                            }}
                        >
                            {s.label}
                        </span>
                        {i < steps.length - 1 && (
                            <div
                                style={{
                                    width: 40,
                                    height: 2,
                                    background: step > s.num ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                                    marginRight: 16,
                                }}
                            />
                        )}
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="container" style={{ maxWidth: '900px', paddingTop: 'var(--spacing-xl)' }}>
            {/* Toast */}
            {toast && (
                <div className="toast-container">
                    <div className={`toast toast-${toast.type}`}>
                        {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                        <span>{toast.message}</span>
                    </div>
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <Zap size={28} style={{ color: 'var(--accent-primary)' }} />
                    Outreach
                </h1>
                <button className="btn btn-ghost" onClick={() => setShowSettings(true)}>
                    <Settings size={20} />
                    Settings
                </button>
            </div>

            {/* Profile warning */}
            {!isProfileComplete() && step < 3 && (
                <div
                    style={{
                        padding: 'var(--spacing-md)',
                        background: 'rgba(249, 115, 22, 0.1)',
                        border: '1px solid rgba(249, 115, 22, 0.3)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: 'var(--spacing-lg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <span>
                        <AlertCircle size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                        Complete your profile to personalize emails
                    </span>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowSettings(true)}>
                        Set Up Profile
                    </button>
                </div>
            )}

            {/* Step indicator */}
            {renderStepIndicator()}

            {/* Step 1: Purpose Selection */}
            {step === 1 && (
                <div>
                    <h2 style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>
                        What do you want to reach out for?
                    </h2>
                    <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
                        {EMAIL_PURPOSES.map((purpose) => {
                            const Icon = purpose.icon;
                            const isSelected = selectedPurpose?.id === purpose.id;

                            return (
                                <div
                                    key={purpose.id}
                                    className="card card-glow"
                                    style={{
                                        cursor: 'pointer',
                                        border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                                        background: isSelected ? 'rgba(249, 115, 22, 0.05)' : 'var(--bg-card)',
                                    }}
                                    onClick={() => setSelectedPurpose(purpose)}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)' }}>
                                        <div
                                            style={{
                                                width: 56,
                                                height: 56,
                                                borderRadius: 'var(--radius-lg)',
                                                background: isSelected ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <Icon size={28} style={{ color: isSelected ? 'white' : 'var(--accent-primary)' }} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ marginBottom: 4 }}>{purpose.title}</h3>
                                            <p style={{ color: 'var(--text-muted)', margin: 0 }}>{purpose.description}</p>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                            <Paperclip size={16} style={{ color: 'var(--text-muted)' }} />
                                            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                                {purpose.attachment === 'resume' ? 'Resume' : 'Portfolio'}
                                            </span>
                                        </div>
                                        {isSelected && <CheckCircle size={24} style={{ color: 'var(--accent-primary)' }} />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--spacing-xl)' }}>
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={() => selectedPurpose && setStep(2)}
                            disabled={!selectedPurpose}
                        >
                            Next
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Company & Filters */}
            {step === 2 && (
                <div>
                    <h2 style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>
                        Who are you targeting?
                    </h2>

                    <div className="card">
                        {/* Company Name */}
                        <div className="form-group">
                            <label className="form-label required">Company Name</label>
                            <div style={{ position: 'relative' }}>
                                <Building2 size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    className="form-input"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    placeholder="e.g., Blackstone, Goldman Sachs, Stripe"
                                    style={{ paddingLeft: 44 }}
                                />
                            </div>
                        </div>

                        {/* Company Website */}
                        <div className="form-group">
                            <label className="form-label">Company Website (optional)</label>
                            <div style={{ position: 'relative' }}>
                                <Globe size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    className="form-input"
                                    value={companyWebsite}
                                    onChange={(e) => setCompanyWebsite(e.target.value)}
                                    placeholder="e.g., blackstone.com"
                                    style={{ paddingLeft: 44 }}
                                />
                            </div>
                            <p className="form-help">Used for email generation (e.g., first.last@blackstone.com)</p>
                        </div>

                        {/* Filters */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                            <div className="form-group">
                                <label className="form-label">Title Keywords</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={titleFilter}
                                    onChange={(e) => setTitleFilter(e.target.value)}
                                    placeholder="Partner, Director, Head of"
                                />
                                <p className="form-help">Comma-separated titles to target</p>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Seniority</label>
                                <select
                                    className="form-select"
                                    value={seniorityFilter}
                                    onChange={(e) => setSeniorityFilter(e.target.value)}
                                >
                                    <option value="C-level">C-Level Only</option>
                                    <option value="Director+">Director and above</option>
                                    <option value="Manager+">Manager and above</option>
                                    <option value="All">All levels</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                            <div className="form-group">
                                <label className="form-label">Location (optional)</label>
                                <div style={{ position: 'relative' }}>
                                    <MapPin size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={locationFilter}
                                        onChange={(e) => setLocationFilter(e.target.value)}
                                        placeholder="e.g., New York, Remote"
                                        style={{ paddingLeft: 44 }}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Max Contacts</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={maxContacts}
                                    onChange={(e) => setMaxContacts(parseInt(e.target.value) || 10)}
                                    min={1}
                                    max={50}
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--spacing-xl)' }}>
                        <button className="btn btn-secondary" onClick={() => setStep(1)}>
                            <ChevronLeft size={20} />
                            Back
                        </button>
                        <button className="btn btn-primary btn-lg" onClick={findPeople} disabled={loading || !companyName.trim()}>
                            {loading ? (
                                <>
                                    <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                                    Finding people...
                                </>
                            ) : (
                                <>
                                    <Search size={20} />
                                    Find People
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Review & Send */}
            {step === 3 && (
                <div>
                    <h2 style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>
                        Review & Send
                    </h2>

                    {/* Summary */}
                    <div className="card" style={{ marginBottom: 'var(--spacing-lg)', background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, var(--bg-card) 50%)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3>{companyName}</h3>
                                <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                                    {selectedPurpose?.title} • {foundPeople.filter((p) => p.selected).length} contacts selected
                                </p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                <Paperclip size={16} />
                                <span style={{ fontSize: '0.875rem' }}>{getAttachmentName(selectedPurpose?.attachment || 'resume')}</span>
                            </div>
                        </div>
                    </div>

                    {/* People Table */}
                    <div className="table-container" style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th style={{ width: 40 }}></th>
                                    <th>Contact</th>
                                    <th>Title</th>
                                    <th>Email</th>
                                    <th>Confidence</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {foundPeople.map((person) => (
                                    <tr key={person.id}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={person.selected}
                                                onChange={() => togglePerson(person.id)}
                                                style={{ width: 18, height: 18, cursor: 'pointer' }}
                                            />
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{person.fullName}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{person.location}</div>
                                        </td>
                                        <td>{person.title}</td>
                                        <td>
                                            <code style={{ fontSize: '0.8125rem' }}>{person.email}</code>
                                        </td>
                                        <td>
                                            <span className={`badge ${person.emailConfidence === 'high' ? 'badge-success' : person.emailConfidence === 'medium' ? 'badge-warning' : 'badge-gray'}`}>
                                                {person.emailConfidence}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => {
                                                    setPreviewingPerson(person);
                                                    setEditingEmail(emailPreviews.get(person.id) || null);
                                                }}
                                            >
                                                <Eye size={16} />
                                                Preview
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <button className="btn btn-secondary" onClick={() => setStep(2)}>
                            <ChevronLeft size={20} />
                            Back
                        </button>
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={sendEmails}
                            disabled={sending || foundPeople.filter((p) => p.selected).length === 0}
                        >
                            {sending ? (
                                <>
                                    <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                                    Sending {sendProgress.current}/{sendProgress.total}...
                                </>
                            ) : (
                                <>
                                    <Send size={20} />
                                    Send {foundPeople.filter((p) => p.selected).length} Emails
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 4: History */}
            {step === 4 && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                        <h2>Outreach History</h2>
                        <button className="btn btn-primary" onClick={() => { setStep(1); setFoundPeople([]); setCompanyName(''); }}>
                            <ArrowRight size={18} />
                            New Campaign
                        </button>
                    </div>

                    {outreachHistory.length === 0 ? (
                        <div className="card empty-state">
                            <div className="empty-state-icon">
                                <History size={40} />
                            </div>
                            <h3 className="empty-state-title">No campaigns yet</h3>
                            <p className="empty-state-description">Your sent campaigns will appear here</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
                            {outreachHistory.map((campaign) => (
                                <div key={campaign.id} className="card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <h3 style={{ marginBottom: 4 }}>{campaign.company}</h3>
                                            <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                                                {campaign.purpose} • {new Date(campaign.date).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <span className="badge badge-success">
                                            {campaign.sentCount}/{campaign.totalCount} sent
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Email Preview Modal */}
            {previewingPerson && editingEmail && (
                <div className="modal-overlay" onClick={() => setPreviewingPerson(null)}>
                    <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Email to {previewingPerson.fullName}</h3>
                            <button className="modal-close" onClick={() => setPreviewingPerson(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">To</label>
                                <input type="text" className="form-input" value={editingEmail.to} disabled />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Subject</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={editingEmail.subject}
                                    onChange={(e) => {
                                        setEditingEmail({ ...editingEmail, subject: e.target.value });
                                        updateEmailPreview(previewingPerson.id, 'subject', e.target.value);
                                    }}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Body</label>
                                <textarea
                                    className="form-textarea"
                                    value={editingEmail.body}
                                    onChange={(e) => {
                                        setEditingEmail({ ...editingEmail, body: e.target.value });
                                        updateEmailPreview(previewingPerson.id, 'body', e.target.value);
                                    }}
                                    rows={15}
                                />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', color: 'var(--text-muted)' }}>
                                <Paperclip size={16} />
                                Attachment: {editingEmail.attachment}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setPreviewingPerson(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {showSettings && (
                <div className="modal-overlay" onClick={() => setShowSettings(false)}>
                    <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Settings</h3>
                            <button className="modal-close" onClick={() => setShowSettings(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <h4 style={{ marginBottom: 'var(--spacing-md)' }}>Your Profile</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                <div className="form-group">
                                    <label className="form-label required">Full Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={profile.fullName}
                                        onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                                        placeholder="John Smith"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label required">Role/Title</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={profile.role}
                                        onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                                        placeholder="Software Engineer"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label required">Your Email</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={profile.email}
                                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                    placeholder="you@email.com"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Short Bio</label>
                                <textarea
                                    className="form-textarea"
                                    value={profile.bio}
                                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                    placeholder="1-2 lines about yourself"
                                    rows={2}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                <div className="form-group">
                                    <label className="form-label">LinkedIn URL</label>
                                    <input
                                        type="url"
                                        className="form-input"
                                        value={profile.linkedinUrl}
                                        onChange={(e) => setProfile({ ...profile, linkedinUrl: e.target.value })}
                                        placeholder="linkedin.com/in/you"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Portfolio URL</label>
                                    <input
                                        type="url"
                                        className="form-input"
                                        value={profile.portfolioUrl}
                                        onChange={(e) => setProfile({ ...profile, portfolioUrl: e.target.value })}
                                        placeholder="yourportfolio.com"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Resume File Path</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={profile.resumePath}
                                    onChange={(e) => setProfile({ ...profile, resumePath: e.target.value })}
                                    placeholder="/path/to/resume.pdf or URL"
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowSettings(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={saveProfile}>
                                Save Profile
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
