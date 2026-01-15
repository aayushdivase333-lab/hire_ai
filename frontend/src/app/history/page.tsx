'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    History,
    ArrowRight,
    Building2,
    Mail,
    Calendar,
    ChevronDown,
    ChevronRight,
    CheckCircle,
    AlertCircle,
    Trash2,
} from 'lucide-react';

interface Campaign {
    id: string;
    purpose: string;
    company: string;
    date: string;
    contacts: {
        personId: string;
        name: string;
        email: string;
        status: 'sent' | 'error';
        error?: string;
        timestamp: string;
    }[];
    sentCount: number;
    totalCount: number;
}

export default function HistoryPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem('outreach_history');
        if (stored) {
            setCampaigns(JSON.parse(stored));
        }
    }, []);

    function deleteCampaign(id: string) {
        if (!confirm('Delete this campaign?')) return;
        const updated = campaigns.filter((c) => c.id !== id);
        setCampaigns(updated);
        localStorage.setItem('outreach_history', JSON.stringify(updated));
    }

    function clearAll() {
        if (!confirm('Delete all campaign history?')) return;
        setCampaigns([]);
        localStorage.removeItem('outreach_history');
    }

    return (
        <div className="container" style={{ maxWidth: '900px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <History size={28} style={{ color: 'var(--accent-primary)' }} />
                    Outreach History
                </h1>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    {campaigns.length > 0 && (
                        <button className="btn btn-secondary btn-sm" onClick={clearAll}>
                            <Trash2 size={16} />
                            Clear All
                        </button>
                    )}
                    <Link href="/" className="btn btn-primary">
                        <ArrowRight size={18} />
                        New Campaign
                    </Link>
                </div>
            </div>

            {/* Campaigns */}
            {campaigns.length === 0 ? (
                <div className="card empty-state">
                    <div className="empty-state-icon">
                        <History size={40} />
                    </div>
                    <h3 className="empty-state-title">No campaigns yet</h3>
                    <p className="empty-state-description">
                        Your sent campaigns will appear here
                    </p>
                    <Link href="/" className="btn btn-primary">
                        Start First Campaign
                    </Link>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
                    {campaigns.map((campaign) => {
                        const isExpanded = expandedId === campaign.id;

                        return (
                            <div key={campaign.id} className="card">
                                {/* Campaign Header */}
                                <div
                                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                                    onClick={() => setExpandedId(isExpanded ? null : campaign.id)}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                        <div
                                            style={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: 'var(--radius-md)',
                                                background: 'var(--accent-primary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <Building2 size={22} style={{ color: 'white' }} />
                                        </div>
                                        <div>
                                            <h3 style={{ marginBottom: 4 }}>{campaign.company}</h3>
                                            <div style={{ display: 'flex', gap: 'var(--spacing-md)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                                <span>{campaign.purpose}</span>
                                                <span>•</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <Calendar size={14} />
                                                    {new Date(campaign.date).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                        <span className="badge badge-success">
                                            <Mail size={12} />
                                            {campaign.sentCount}/{campaign.totalCount}
                                        </span>
                                        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                    </div>
                                </div>

                                {/* Expanded Contacts */}
                                {isExpanded && (
                                    <div style={{ marginTop: 'var(--spacing-lg)', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--spacing-lg)' }}>
                                        <table className="table" style={{ margin: 0 }}>
                                            <thead>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Email</th>
                                                    <th>Status</th>
                                                    <th>Time</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {campaign.contacts.map((contact) => (
                                                    <tr key={contact.personId}>
                                                        <td style={{ fontWeight: 500 }}>{contact.name}</td>
                                                        <td>
                                                            <code style={{ fontSize: '0.8125rem' }}>{contact.email}</code>
                                                        </td>
                                                        <td>
                                                            {contact.status === 'sent' ? (
                                                                <span className="badge badge-success">
                                                                    <CheckCircle size={12} />
                                                                    Sent
                                                                </span>
                                                            ) : (
                                                                <span className="badge badge-danger">
                                                                    <AlertCircle size={12} />
                                                                    Error
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                                            {new Date(contact.timestamp).toLocaleTimeString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>

                                        <div style={{ marginTop: 'var(--spacing-md)', display: 'flex', justifyContent: 'flex-end' }}>
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteCampaign(campaign.id);
                                                }}
                                                style={{ color: 'var(--accent-danger)' }}
                                            >
                                                <Trash2 size={14} />
                                                Delete Campaign
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
