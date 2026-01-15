'use client';

import { useState, useEffect } from 'react';
import {
    Settings,
    Mail,
    Shield,
    Database,
    Clock,
    AlertCircle,
    CheckCircle,
    Trash2,
    Download,
    RefreshCw,
} from 'lucide-react';
import { systemApi } from '@/lib/api';

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<any>(null);
    const [health, setHealth] = useState<any>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [cleanupDays, setCleanupDays] = useState(90);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    async function fetchData() {
        setLoading(true);
        try {
            const [healthResult, settingsResult] = await Promise.all([
                systemApi.health() as any,
                systemApi.settings() as any,
            ]);
            if (healthResult?.success) setHealth(healthResult.data);
            if (settingsResult?.success) setSettings(settingsResult.data);
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleCleanup() {
        if (!confirm(`This will delete all data older than ${cleanupDays} days. Continue?`)) return;
        try {
            await systemApi.cleanup(cleanupDays);
            setToast({ message: 'Cleanup completed', type: 'success' });
            fetchData();
        } catch (error: any) {
            setToast({ message: error.message, type: 'error' });
        }
    }

    async function handleDeleteAll() {
        const confirmText = prompt('Type "DELETE ALL DATA" to confirm:');
        if (confirmText !== 'DELETE ALL DATA') {
            setToast({ message: 'Deletion cancelled', type: 'error' });
            return;
        }
        try {
            await systemApi.deleteAll();
            setToast({ message: 'All data deleted', type: 'success' });
            fetchData();
        } catch (error: any) {
            setToast({ message: error.message, type: 'error' });
        }
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
            {/* Toast */}
            {toast && (
                <div className="toast-container">
                    <div className={`toast toast-${toast.type}`}>
                        {toast.type === 'success' ? (
                            <CheckCircle size={18} style={{ color: 'var(--accent-success)' }} />
                        ) : (
                            <AlertCircle size={18} style={{ color: 'var(--accent-danger)' }} />
                        )}
                        <span>{toast.message}</span>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="page-header">
                <h1 className="page-title">
                    <Settings size={28} style={{ color: 'var(--accent-primary)' }} />
                    Settings
                </h1>
                <p className="page-subtitle">
                    Configure your lead finder settings and manage data
                </p>
            </div>

            {/* System Health */}
            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <h3 style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <Database size={20} style={{ color: 'var(--accent-primary)' }} />
                    System Health
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
                    <div style={{ padding: 'var(--spacing-md)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Status</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-success)' }} />
                            <span style={{ fontWeight: 600 }}>{health?.status || 'Online'}</span>
                        </div>
                    </div>
                    <div style={{ padding: 'var(--spacing-md)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Database</div>
                        <div style={{ fontWeight: 600, marginTop: '4px' }}>{health?.database || 'Connected'}</div>
                    </div>
                    <div style={{ padding: 'var(--spacing-md)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Uptime</div>
                        <div style={{ fontWeight: 600, marginTop: '4px' }}>{health?.uptime || '—'}</div>
                    </div>
                    <div style={{ padding: 'var(--spacing-md)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Version</div>
                        <div style={{ fontWeight: 600, marginTop: '4px' }}>1.0.0</div>
                    </div>
                </div>
            </div>

            {/* Email Configuration */}
            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <h3 style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <Mail size={20} style={{ color: 'var(--accent-primary)' }} />
                    Email Configuration
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
                    <div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>SMTP Server</div>
                        <div style={{ fontWeight: 500 }}>{settings?.email?.smtpHost || 'Not configured'}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>From Email</div>
                        <div style={{ fontWeight: 500 }}>{settings?.email?.fromEmail || 'Not configured'}</div>
                    </div>
                </div>
                <p style={{ marginTop: 'var(--spacing-lg)', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Email settings are configured via environment variables. See <code>backend/.env</code>
                </p>
            </div>

            {/* Rate Limiting */}
            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <h3 style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <Clock size={20} style={{ color: 'var(--accent-primary)' }} />
                    Rate Limiting
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
                    <div style={{ padding: 'var(--spacing-md)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Hourly Limit</div>
                        <div style={{ fontWeight: 600, fontSize: '1.25rem', marginTop: '4px' }}>
                            {settings?.rateLimit?.hourlyLimit || 15} emails/hour
                        </div>
                    </div>
                    <div style={{ padding: 'var(--spacing-md)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Daily Limit</div>
                        <div style={{ fontWeight: 600, fontSize: '1.25rem', marginTop: '4px' }}>
                            {settings?.rateLimit?.dailyLimit || 100} emails/day
                        </div>
                    </div>
                    <div style={{ padding: 'var(--spacing-md)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Min Delay</div>
                        <div style={{ fontWeight: 600, fontSize: '1.25rem', marginTop: '4px' }}>
                            {(settings?.rateLimit?.minDelay || 180000) / 1000}s between emails
                        </div>
                    </div>
                </div>
            </div>

            {/* Privacy & Compliance */}
            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <h3 style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <Shield size={20} style={{ color: 'var(--accent-primary)' }} />
                    Privacy & Compliance
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-md)' }}>
                    {[
                        { label: 'GDPR Compliant', status: true, desc: 'Data can be deleted on request' },
                        { label: 'CAN-SPAM Compliant', status: true, desc: 'Opt-out in every email' },
                        { label: 'AES-256 Encryption', status: true, desc: 'Emails encrypted at rest' },
                        { label: 'ToS Compliant', status: true, desc: 'No LinkedIn automation' },
                    ].map((item) => (
                        <div
                            key={item.label}
                            style={{
                                padding: 'var(--spacing-md)',
                                background: 'var(--bg-tertiary)',
                                borderRadius: 'var(--radius-md)',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 'var(--spacing-md)',
                            }}
                        >
                            <CheckCircle size={20} style={{ color: 'var(--accent-success)', flexShrink: 0 }} />
                            <div>
                                <div style={{ fontWeight: 500 }}>{item.label}</div>
                                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{item.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Data Management */}
            <div className="card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                <h3 style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', color: 'var(--accent-danger)' }}>
                    <Trash2 size={20} />
                    Data Management
                </h3>

                <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                    <h4 style={{ marginBottom: 'var(--spacing-sm)' }}>Cleanup Old Data</h4>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-md)' }}>
                        Delete outreach messages and audit logs older than a specified number of days.
                    </p>
                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
                        <input
                            type="number"
                            className="form-input"
                            value={cleanupDays}
                            onChange={(e) => setCleanupDays(parseInt(e.target.value) || 30)}
                            min={7}
                            max={365}
                            style={{ width: '100px' }}
                        />
                        <span style={{ color: 'var(--text-muted)' }}>days old</span>
                        <button className="btn btn-secondary" onClick={handleCleanup}>
                            <RefreshCw size={16} />
                            Run Cleanup
                        </button>
                    </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 'var(--spacing-lg)' }}>
                    <h4 style={{ marginBottom: 'var(--spacing-sm)', color: 'var(--accent-danger)' }}>Delete All Data</h4>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-md)' }}>
                        Permanently delete ALL data including companies, contacts, emails, and outreach history.
                        This action cannot be undone.
                    </p>
                    <button className="btn btn-danger" onClick={handleDeleteAll}>
                        <Trash2 size={16} />
                        Delete All Data
                    </button>
                </div>
            </div>
        </div>
    );
}
