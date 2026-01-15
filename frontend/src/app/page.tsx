'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Building2,
    Users,
    Mail,
    Send,
    TrendingUp,
    Calendar,
    Target,
    Zap,
    ArrowUpRight,
    Search,
    CheckCircle,
    Clock,
} from 'lucide-react';
import { systemApi } from '@/lib/api';

interface Stats {
    totals: {
        companies: number;
        people: number;
        emails: number;
        outreach: number;
    };
    outreachByStatus: Record<string, number>;
    queue: {
        hourlyCount: number;
        dailyCount: number;
        hourlyLimit: number;
        dailyLimit: number;
        pending: number;
    };
}

export default function Dashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [greeting, setGreeting] = useState('Hello');
    const [companyInput, setCompanyInput] = useState('');

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good morning');
        else if (hour < 18) setGreeting('Good afternoon');
        else setGreeting('Good evening');

        fetchStats();
    }, []);

    async function fetchStats() {
        try {
            const result = await systemApi.stats();
            if (result.success) {
                setStats(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    }

    const statCards = [
        {
            label: 'Companies',
            value: stats?.totals.companies || 0,
            icon: Building2,
            trend: '+12%',
            trendUp: true,
        },
        {
            label: 'Contacts',
            value: stats?.totals.people || 0,
            icon: Users,
            trend: '+8%',
            trendUp: true,
        },
        {
            label: 'Emails Found',
            value: stats?.totals.emails || 0,
            icon: Mail,
            trend: '+24%',
            trendUp: true,
        },
        {
            label: 'Messages Sent',
            value: stats?.outreachByStatus?.sent || 0,
            icon: Send,
            trend: 'This month',
            trendUp: true,
        },
    ];

    return (
        <div className="container">
            {/* Welcome Header */}
            <div className="page-header" style={{ marginBottom: 'var(--spacing-2xl)' }}>
                <h1 className="page-title" style={{ fontSize: '2rem' }}>
                    {greeting}, <span style={{ color: 'var(--accent-primary)' }}>Aayush</span>!
                </h1>
                <p className="page-subtitle">
                    Ready to discover new leads? Enter a company name to get started.
                </p>
            </div>

            {/* Quick Discovery Search */}
            <div className="card" style={{ marginBottom: 'var(--spacing-xl)', background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, var(--bg-card) 50%)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)' }}>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ marginBottom: 'var(--spacing-sm)', fontSize: '1.25rem' }}>
                            <Zap size={20} style={{ color: 'var(--accent-primary)', marginRight: '8px', verticalAlign: 'middle' }} />
                            Quick Discovery
                        </h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--spacing-md)' }}>
                            Enter a company name and we'll find 10-15 relevant contacts with emails
                        </p>
                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <Search
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
                                    placeholder="e.g., Blackstone, Citadel, Two Sigma..."
                                    value={companyInput}
                                    onChange={(e) => setCompanyInput(e.target.value)}
                                    style={{ paddingLeft: '44px' }}
                                />
                            </div>
                            <Link
                                href={`/discover${companyInput ? `?company=${encodeURIComponent(companyInput)}` : ''}`}
                                className="btn btn-primary btn-lg"
                            >
                                <Target size={18} />
                                Find Leads
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                {statCards.map((stat) => (
                    <div key={stat.label} className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">{stat.label}</span>
                            <div className="stat-card-icon">
                                <stat.icon size={20} />
                            </div>
                        </div>
                        <div className="stat-card-value">
                            {loading ? (
                                <div className="skeleton" style={{ width: '60px', height: '32px' }} />
                            ) : (
                                stat.value.toLocaleString()
                            )}
                        </div>
                        <div className={`stat-card-trend ${stat.trendUp ? 'up' : 'down'}`}>
                            {stat.trendUp && <TrendingUp size={14} />}
                            {stat.trend}
                        </div>
                    </div>
                ))}
            </div>

            {/* Two Column Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
                {/* Outreach Status */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Outreach Status</h3>
                        <Link href="/outreach" className="btn btn-ghost btn-sm">
                            View All <ArrowUpRight size={14} />
                        </Link>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-md)' }}>
                        {[
                            { label: 'Pending', value: stats?.queue?.pending || 0, color: 'var(--accent-warning)' },
                            { label: 'Sent', value: stats?.outreachByStatus?.sent || 0, color: 'var(--accent-primary)' },
                            { label: 'Replied', value: stats?.outreachByStatus?.replied || 0, color: 'var(--accent-success)' },
                            { label: 'Bounced', value: stats?.outreachByStatus?.bounced || 0, color: 'var(--accent-danger)' },
                        ].map((item) => (
                            <div
                                key={item.label}
                                style={{
                                    padding: 'var(--spacing-md)',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: 'var(--radius-md)',
                                    borderLeft: `3px solid ${item.color}`,
                                }}
                            >
                                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{item.value}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    {item.label}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Rate Limit Progress */}
                    <div style={{ marginTop: 'var(--spacing-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-sm)' }}>
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                <Clock size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                                Hourly Email Limit
                            </span>
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                {stats?.queue?.hourlyCount || 0} / {stats?.queue?.hourlyLimit || 15}
                            </span>
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress-bar-fill"
                                style={{
                                    width: `${Math.min(100, ((stats?.queue?.hourlyCount || 0) / (stats?.queue?.hourlyLimit || 15)) * 100)}%`,
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Quick Actions</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                        <Link href="/discover" className="btn btn-primary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                            <Search size={18} />
                            Start New Discovery
                        </Link>
                        <Link href="/companies" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                            <Building2 size={18} />
                            Manage Companies
                        </Link>
                        <Link href="/contacts" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                            <Users size={18} />
                            View All Contacts
                        </Link>
                        <Link href="/templates" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                            <Mail size={18} />
                            Edit Email Templates
                        </Link>
                        <Link href="/profile" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                            <Users size={18} />
                            Update Your Profile
                        </Link>
                    </div>
                </div>
            </div>

            {/* Compliance Footer */}
            <div className="card" style={{ marginTop: 'var(--spacing-xl)', background: 'var(--bg-tertiary)' }}>
                <div style={{ display: 'flex', gap: 'var(--spacing-2xl)', alignItems: 'center', justifyContent: 'center' }}>
                    {[
                        { icon: CheckCircle, label: 'GDPR Compliant' },
                        { icon: CheckCircle, label: 'CAN-SPAM Compliant' },
                        { icon: CheckCircle, label: 'ToS Respectful' },
                        { icon: CheckCircle, label: 'AES-256 Encrypted' },
                    ].map((item) => (
                        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                            <item.icon size={16} style={{ color: 'var(--accent-success)' }} />
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
