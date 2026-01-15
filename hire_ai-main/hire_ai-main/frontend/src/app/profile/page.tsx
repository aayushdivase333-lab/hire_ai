'use client';

import { useState, useEffect } from 'react';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Globe,
    Linkedin,
    Github,
    FileText,
    Save,
    CheckCircle,
    Briefcase,
} from 'lucide-react';
import { systemApi } from '@/lib/api';

interface ProfileData {
    // Personal Info
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    city: string;
    country: string;
    linkedinUrl: string;
    githubUrl: string;
    portfolioUrl: string;

    // Business Info
    businessName: string;
    businessRole: string;

    // Email Signature
    emailSignature: string;

    // Service Offerings
    services: {
        websiteSupport: boolean;
        technicalSupport: boolean;
        automation: boolean;
        customDashboards: boolean;
        consulting: boolean;
    };

    // Pitch Summary
    serviceSummary: string;
}

const DEFAULT_PROFILE: ProfileData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    country: 'United States',
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
    businessName: '',
    businessRole: 'Founder',
    emailSignature: '',
    services: {
        websiteSupport: true,
        technicalSupport: false,
        automation: true,
        customDashboards: true,
        consulting: false,
    },
    serviceSummary: 'I help boutique firms modernize their digital presence with custom websites, automation tools, and data dashboards.',
};

export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState<'personal' | 'business' | 'services'>('personal');
    const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    async function loadProfile() {
        try {
            // Load from localStorage for now (backend can be extended)
            const stored = localStorage.getItem('leadfinder_profile');
            if (stored) {
                setProfile(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
        } finally {
            setLoading(false);
        }
    }

    async function saveProfile() {
        setSaving(true);
        try {
            // Save to localStorage
            localStorage.setItem('leadfinder_profile', JSON.stringify(profile));

            // Also update backend settings
            // await systemApi.updateSettings({ ... });

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Failed to save profile:', error);
        } finally {
            setSaving(false);
        }
    }

    function updateProfile<K extends keyof ProfileData>(key: K, value: ProfileData[K]) {
        setProfile({ ...profile, [key]: value });
    }

    if (loading) {
        return (
            <div className="container" style={{ display: 'flex', justifyContent: 'center', paddingTop: '20vh' }}>
                <div className="spinner spinner-lg" />
            </div>
        );
    }

    return (
        <div className="container">
            {/* Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title">
                        <User size={28} style={{ color: 'var(--accent-primary)' }} />
                        Profile
                    </h1>
                    <p className="page-subtitle">
                        Your information is used to personalize email templates
                    </p>
                </div>
                <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>
                    {saving ? (
                        <span className="spinner" />
                    ) : saved ? (
                        <>
                            <CheckCircle size={18} />
                            Saved!
                        </>
                    ) : (
                        <>
                            <Save size={18} />
                            Save Profile
                        </>
                    )}
                </button>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'personal' ? 'active' : ''}`}
                    onClick={() => setActiveTab('personal')}
                >
                    <User size={16} style={{ marginRight: '6px' }} />
                    Personal Info
                </button>
                <button
                    className={`tab ${activeTab === 'business' ? 'active' : ''}`}
                    onClick={() => setActiveTab('business')}
                >
                    <Briefcase size={16} style={{ marginRight: '6px' }} />
                    Business
                </button>
                <button
                    className={`tab ${activeTab === 'services' ? 'active' : ''}`}
                    onClick={() => setActiveTab('services')}
                >
                    <FileText size={16} style={{ marginRight: '6px' }} />
                    Services & Pitch
                </button>
            </div>

            {/* Personal Info Tab */}
            {activeTab === 'personal' && (
                <div className="card">
                    <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Personal Information</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
                        <div className="form-group">
                            <label className="form-label required">First Name</label>
                            <input
                                type="text"
                                className="form-input"
                                value={profile.firstName}
                                onChange={(e) => updateProfile('firstName', e.target.value)}
                                placeholder="John"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label required">Last Name</label>
                            <input
                                type="text"
                                className="form-input"
                                value={profile.lastName}
                                onChange={(e) => updateProfile('lastName', e.target.value)}
                                placeholder="Smith"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
                        <div className="form-group">
                            <label className="form-label required">Email</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="email"
                                    className="form-input"
                                    value={profile.email}
                                    onChange={(e) => updateProfile('email', e.target.value)}
                                    placeholder="john@example.com"
                                    style={{ paddingLeft: '44px' }}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Phone</label>
                            <div style={{ position: 'relative' }}>
                                <Phone size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="tel"
                                    className="form-input"
                                    value={profile.phone}
                                    onChange={(e) => updateProfile('phone', e.target.value)}
                                    placeholder="+1 (555) 123-4567"
                                    style={{ paddingLeft: '44px' }}
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
                        <div className="form-group">
                            <label className="form-label">City</label>
                            <div style={{ position: 'relative' }}>
                                <MapPin size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    className="form-input"
                                    value={profile.city}
                                    onChange={(e) => updateProfile('city', e.target.value)}
                                    placeholder="New York"
                                    style={{ paddingLeft: '44px' }}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Country</label>
                            <select
                                className="form-select"
                                value={profile.country}
                                onChange={(e) => updateProfile('country', e.target.value)}
                            >
                                <option value="United States">United States</option>
                                <option value="Canada">Canada</option>
                                <option value="United Kingdom">United Kingdom</option>
                                <option value="Australia">Australia</option>
                                <option value="India">India</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">LinkedIn URL</label>
                        <div style={{ position: 'relative' }}>
                            <Linkedin size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="url"
                                className="form-input"
                                value={profile.linkedinUrl}
                                onChange={(e) => updateProfile('linkedinUrl', e.target.value)}
                                placeholder="https://linkedin.com/in/yourprofile"
                                style={{ paddingLeft: '44px' }}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">GitHub URL</label>
                        <div style={{ position: 'relative' }}>
                            <Github size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="url"
                                className="form-input"
                                value={profile.githubUrl}
                                onChange={(e) => updateProfile('githubUrl', e.target.value)}
                                placeholder="https://github.com/yourusername"
                                style={{ paddingLeft: '44px' }}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Portfolio URL</label>
                        <div style={{ position: 'relative' }}>
                            <Globe size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="url"
                                className="form-input"
                                value={profile.portfolioUrl}
                                onChange={(e) => updateProfile('portfolioUrl', e.target.value)}
                                placeholder="https://yourportfolio.com"
                                style={{ paddingLeft: '44px' }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Business Tab */}
            {activeTab === 'business' && (
                <div className="card">
                    <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Business Information</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
                        <div className="form-group">
                            <label className="form-label">Business/Agency Name</label>
                            <input
                                type="text"
                                className="form-input"
                                value={profile.businessName}
                                onChange={(e) => updateProfile('businessName', e.target.value)}
                                placeholder="Smith Digital Consulting"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Your Role</label>
                            <select
                                className="form-select"
                                value={profile.businessRole}
                                onChange={(e) => updateProfile('businessRole', e.target.value)}
                            >
                                <option value="Founder">Founder</option>
                                <option value="CEO">CEO</option>
                                <option value="Principal">Principal</option>
                                <option value="Consultant">Consultant</option>
                                <option value="Developer">Developer</option>
                                <option value="Freelancer">Freelancer</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email Signature</label>
                        <textarea
                            className="form-textarea"
                            value={profile.emailSignature}
                            onChange={(e) => updateProfile('emailSignature', e.target.value)}
                            placeholder="Best regards,&#10;John Smith&#10;Founder, Smith Digital&#10;+1 (555) 123-4567"
                            rows={5}
                        />
                        <p className="form-help">
                            This will be appended to your emails. Use line breaks for formatting.
                        </p>
                    </div>
                </div>
            )}

            {/* Services Tab */}
            {activeTab === 'services' && (
                <div className="card">
                    <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Services You Offer</h3>

                    <div className="form-group">
                        <label className="form-label">Select your services</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-sm)' }}>
                            {[
                                { key: 'websiteSupport', label: 'Website Design & Support' },
                                { key: 'technicalSupport', label: 'Technical Support' },
                                { key: 'automation', label: 'Automation & Workflows' },
                                { key: 'customDashboards', label: 'Custom Dashboards' },
                                { key: 'consulting', label: 'Tech Consulting' },
                            ].map((service) => (
                                <label
                                    key={service.key}
                                    className={`form-checkbox-item ${profile.services[service.key as keyof typeof profile.services] ? 'selected' : ''}`}
                                    style={{ padding: 'var(--spacing-md)', justifyContent: 'flex-start' }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={profile.services[service.key as keyof typeof profile.services]}
                                        onChange={(e) =>
                                            updateProfile('services', {
                                                ...profile.services,
                                                [service.key]: e.target.checked,
                                            })
                                        }
                                    />
                                    {service.label}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="form-group" style={{ marginTop: 'var(--spacing-xl)' }}>
                        <label className="form-label required">Your Service Pitch</label>
                        <textarea
                            className="form-textarea"
                            value={profile.serviceSummary}
                            onChange={(e) => updateProfile('serviceSummary', e.target.value)}
                            placeholder="I help boutique firms modernize their digital presence..."
                            rows={4}
                        />
                        <p className="form-help">
                            This is used as <code>{'{{my_service_summary}}'}</code> in your email templates.
                            Keep it concise (1-2 sentences).
                        </p>
                    </div>

                    {/* Preview */}
                    <div style={{ marginTop: 'var(--spacing-xl)', padding: 'var(--spacing-lg)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                        <h4 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            PREVIEW: HOW YOUR PITCH APPEARS IN EMAILS
                        </h4>
                        <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                            "{profile.serviceSummary || 'Your service pitch will appear here...'}"
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
