'use client';

import { useState, useEffect, useRef } from 'react';
import {
    Settings,
    User,
    Mail,
    Globe,
    Linkedin,
    FileText,
    Save,
    CheckCircle,
    AlertCircle,
    Upload,
    Trash2,
    Shield,
    Clock,
} from 'lucide-react';

interface UserProfile {
    fullName: string;
    role: string;
    bio: string;
    linkedinUrl: string;
    portfolioUrl: string;
    resumePath: string;
    email: string;
}

interface SmtpConfig {
    host: string;
    port: string;
    secure: boolean;
    user: string;
    password: string;
}

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<'profile' | 'email' | 'attachments'>('profile');
    const [profile, setProfile] = useState<UserProfile>({
        fullName: '',
        role: '',
        bio: '',
        linkedinUrl: '',
        portfolioUrl: '',
        resumePath: '',
        email: '',
    });
    const [smtp, setSmtp] = useState<SmtpConfig>({
        host: 'smtp.gmail.com',
        port: '587',
        secure: false,
        user: '',
        password: '',
    });
    const [attachments, setAttachments] = useState<{ name: string; path: string; type: string }[]>([]);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Load from localStorage
        const storedProfile = localStorage.getItem('outreach_profile');
        if (storedProfile) setProfile(JSON.parse(storedProfile));

        const storedSmtp = localStorage.getItem('outreach_smtp');
        if (storedSmtp) setSmtp(JSON.parse(storedSmtp));

        const storedAttachments = localStorage.getItem('outreach_attachments');
        if (storedAttachments) setAttachments(JSON.parse(storedAttachments));
    }, []);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    function saveAll() {
        setSaving(true);
        try {
            localStorage.setItem('outreach_profile', JSON.stringify(profile));
            localStorage.setItem('outreach_smtp', JSON.stringify(smtp));
            localStorage.setItem('outreach_attachments', JSON.stringify(attachments));
            setToast({ message: 'Settings saved!', type: 'success' });
        } catch (error) {
            setToast({ message: 'Failed to save settings', type: 'error' });
        }
        setSaving(false);
    }

    function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const files = e.target.files;
        if (!files) return;

        const newAttachments = [...attachments];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            newAttachments.push({
                name: file.name,
                path: URL.createObjectURL(file),
                type: file.name.includes('resume') ? 'resume' : 'portfolio',
            });
        }
        setAttachments(newAttachments);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    function removeAttachment(index: number) {
        setAttachments(attachments.filter((_, i) => i !== index));
    }

    return (
        <div className="container" style={{ maxWidth: '800px' }}>
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
                    <Settings size={28} style={{ color: 'var(--accent-primary)' }} />
                    Settings
                </h1>
                <button className="btn btn-primary" onClick={saveAll} disabled={saving}>
                    {saving ? <span className="spinner" /> : <Save size={18} />}
                    Save All
                </button>
            </div>

            {/* Tabs */}
            <div className="tabs" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <button className={`tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
                    <User size={16} style={{ marginRight: 6 }} />
                    Your Profile
                </button>
                <button className={`tab ${activeTab === 'email' ? 'active' : ''}`} onClick={() => setActiveTab('email')}>
                    <Mail size={16} style={{ marginRight: 6 }} />
                    Email Config
                </button>
                <button className={`tab ${activeTab === 'attachments' ? 'active' : ''}`} onClick={() => setActiveTab('attachments')}>
                    <FileText size={16} style={{ marginRight: 6 }} />
                    Attachments
                </button>
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <div className="card">
                    <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Your Information</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--spacing-lg)' }}>
                        This information is used to personalize your outreach emails.
                    </p>

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
                        <label className="form-label">Short Bio</label>
                        <textarea
                            className="form-textarea"
                            value={profile.bio}
                            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                            placeholder="1-2 lines about yourself and what you do"
                            rows={2}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                        <div className="form-group">
                            <label className="form-label">LinkedIn URL</label>
                            <div style={{ position: 'relative' }}>
                                <Linkedin size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="url"
                                    className="form-input"
                                    value={profile.linkedinUrl}
                                    onChange={(e) => setProfile({ ...profile, linkedinUrl: e.target.value })}
                                    placeholder="linkedin.com/in/you"
                                    style={{ paddingLeft: 44 }}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Portfolio URL</label>
                            <div style={{ position: 'relative' }}>
                                <Globe size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="url"
                                    className="form-input"
                                    value={profile.portfolioUrl}
                                    onChange={(e) => setProfile({ ...profile, portfolioUrl: e.target.value })}
                                    placeholder="yourportfolio.com"
                                    style={{ paddingLeft: 44 }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Email Config Tab */}
            {activeTab === 'email' && (
                <div className="card">
                    <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Email Sending Configuration</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--spacing-lg)' }}>
                        Configure SMTP settings to send emails through your own account.
                    </p>

                    <div className="form-group">
                        <label className="form-label required">Your Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="email"
                                className="form-input"
                                value={profile.email}
                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                placeholder="you@gmail.com"
                                style={{ paddingLeft: 44 }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-md)' }}>
                        <div className="form-group">
                            <label className="form-label">SMTP Host</label>
                            <input
                                type="text"
                                className="form-input"
                                value={smtp.host}
                                onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
                                placeholder="smtp.gmail.com"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Port</label>
                            <input
                                type="text"
                                className="form-input"
                                value={smtp.port}
                                onChange={(e) => setSmtp({ ...smtp, port: e.target.value })}
                                placeholder="587"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">SMTP Password / App Password</label>
                        <input
                            type="password"
                            className="form-input"
                            value={smtp.password}
                            onChange={(e) => setSmtp({ ...smtp, password: e.target.value })}
                            placeholder="••••••••••••••••"
                        />
                        <p className="form-help">
                            For Gmail, use an App Password. Go to Google Account → Security → 2-Step Verification → App passwords
                        </p>
                    </div>

                    {/* Rate Limit Info */}
                    <div style={{ marginTop: 'var(--spacing-lg)', padding: 'var(--spacing-md)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                            <Clock size={18} style={{ color: 'var(--accent-primary)' }} />
                            <strong>Rate Limiting (Default)</strong>
                        </div>
                        <ul style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0, paddingLeft: 'var(--spacing-lg)' }}>
                            <li>10-20 emails per hour with random delays</li>
                            <li>3-5 minute delay between emails</li>
                            <li>100 emails per day maximum</li>
                        </ul>
                    </div>
                </div>
            )}

            {/* Attachments Tab */}
            {activeTab === 'attachments' && (
                <div className="card">
                    <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Attachments</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--spacing-lg)' }}>
                        Upload your resume and portfolio to attach to outreach emails.
                    </p>

                    {/* Upload Area */}
                    <div
                        className="file-upload"
                        onClick={() => fileInputRef.current?.click()}
                        style={{ marginBottom: 'var(--spacing-lg)' }}
                    >
                        <Upload size={32} style={{ marginBottom: 'var(--spacing-sm)' }} />
                        <p style={{ margin: 0 }}>
                            <strong>Click to upload</strong> your resume or portfolio
                        </p>
                        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                            PDF, DOC, DOCX (max 10MB)
                        </p>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".pdf,.doc,.docx"
                        multiple
                        style={{ display: 'none' }}
                    />

                    {/* Attachment List */}
                    {attachments.length > 0 && (
                        <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
                            {attachments.map((attachment, i) => (
                                <div
                                    key={i}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: 'var(--spacing-md)',
                                        background: 'var(--bg-tertiary)',
                                        borderRadius: 'var(--radius-md)',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                        <FileText size={20} style={{ color: 'var(--accent-primary)' }} />
                                        <div>
                                            <div style={{ fontWeight: 500 }}>{attachment.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                Type: {attachment.type}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => removeAttachment(i)}
                                        style={{ color: 'var(--accent-danger)' }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Attachment Logic */}
                    <div style={{ marginTop: 'var(--spacing-xl)', padding: 'var(--spacing-md)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                        <h4 style={{ marginBottom: 'var(--spacing-sm)' }}>Attachment Logic</h4>
                        <ul style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0, paddingLeft: 'var(--spacing-lg)' }}>
                            <li><strong>Job Referral:</strong> Attaches your resume</li>
                            <li><strong>Personal Website:</strong> Attaches your portfolio + includes portfolio link</li>
                            <li><strong>Automation:</strong> Attaches portfolio or case study</li>
                        </ul>
                    </div>
                </div>
            )}

            {/* Privacy Note */}
            <div className="card" style={{ marginTop: 'var(--spacing-lg)', background: 'var(--bg-tertiary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                    <Shield size={18} style={{ color: 'var(--accent-success)' }} />
                    <strong>Privacy & Security</strong>
                </div>
                <ul style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0, paddingLeft: 'var(--spacing-lg)' }}>
                    <li>All settings are stored locally in your browser</li>
                    <li>No data is sent to external servers</li>
                    <li>Use App Passwords instead of your main password</li>
                </ul>
            </div>
        </div>
    );
}
