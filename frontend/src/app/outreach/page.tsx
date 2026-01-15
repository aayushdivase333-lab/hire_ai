'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
    Send,
    Mail,
    Clock,
    CheckCircle,
    XCircle,
    MessageSquare,
    Trash2,
    Filter,
    Calendar,
    Users,
    AlertCircle,
    Eye,
    RefreshCw,
    Plus,
    Play,
    PauseCircle,
    ChevronDown,
} from 'lucide-react';
import { outreachApi, templatesApi, peopleApi } from '@/lib/api';

interface OutreachMessage {
    id: string;
    person_id: string;
    full_name: string;
    company_name: string;
    email_used: string;
    subject: string;
    body: string;
    status: 'draft' | 'queued' | 'pending' | 'sent' | 'delivered' | 'opened' | 'replied' | 'bounced' | 'failed';
    template_name: string;
    scheduled_at: string | null;
    sent_at: string | null;
    created_at: string;
}

interface Template {
    id: string;
    name: string;
    subject: string;
    body: string;
    offer_type: string;
}

interface Contact {
    id: string;
    full_name: string;
    company_name: string;
    primary_email: string;
}

const STATUS_CONFIG = {
    draft: { label: 'Draft', color: 'gray', icon: Clock },
    queued: { label: 'Queued', color: 'warning', icon: Clock },
    pending: { label: 'Sending', color: 'warning', icon: Send },
    sent: { label: 'Sent', color: 'primary', icon: CheckCircle },
    delivered: { label: 'Delivered', color: 'success', icon: CheckCircle },
    opened: { label: 'Opened', color: 'success', icon: Eye },
    replied: { label: 'Replied', color: 'success', icon: MessageSquare },
    bounced: { label: 'Bounced', color: 'danger', icon: XCircle },
    failed: { label: 'Failed', color: 'danger', icon: XCircle },
};

export default function OutreachPage() {
    const searchParams = useSearchParams();
    const preSelectedContactId = searchParams.get('contact_id');

    const [messages, setMessages] = useState<OutreachMessage[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Compose Modal State
    const [showCompose, setShowCompose] = useState(!!preSelectedContactId);
    const [selectedContacts, setSelectedContacts] = useState<string[]>(preSelectedContactId ? [preSelectedContactId] : []);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [customSubject, setCustomSubject] = useState('');
    const [customBody, setCustomBody] = useState('');
    const [sending, setSending] = useState(false);

    // View Modal
    const [viewingMessage, setViewingMessage] = useState<OutreachMessage | null>(null);

    // Stats
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        fetchMessages();
        fetchTemplates();
        fetchContacts();
        fetchStats();
    }, [page, statusFilter]);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    async function fetchMessages() {
        setLoading(true);
        try {
            const result = await outreachApi.list({
                page,
                status: statusFilter || undefined,
            }) as any;
            if (result.success) {
                setMessages(result.data.items);
                setTotalPages(result.data.totalPages);
            }
        } catch (error: any) {
            setToast({ message: error.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    }

    async function fetchTemplates() {
        try {
            const result = await templatesApi.list() as any;
            if (result.success) {
                setTemplates(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch templates:', error);
        }
    }

    async function fetchContacts() {
        try {
            const result = await peopleApi.list({ page: 1 }) as any;
            if (result.success) {
                setContacts(result.data.items.filter((c: any) => c.primary_email && !c.do_not_contact));
            }
        } catch (error) {
            console.error('Failed to fetch contacts:', error);
        }
    }

    async function fetchStats() {
        try {
            const result = await outreachApi.getStats() as any;
            if (result.success) {
                setStats(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    }

    async function handleSend(id: string) {
        try {
            await outreachApi.send(id);
            setToast({ message: 'Message queued for sending', type: 'success' });
            fetchMessages();
            fetchStats();
        } catch (error: any) {
            setToast({ message: error.message, type: 'error' });
        }
    }

    async function handleCancel(id: string) {
        try {
            await outreachApi.cancel(id);
            setToast({ message: 'Message cancelled', type: 'success' });
            fetchMessages();
        } catch (error: any) {
            setToast({ message: error.message, type: 'error' });
        }
    }

    async function handleMarkReplied(id: string) {
        try {
            await outreachApi.markReplied(id);
            setToast({ message: 'Marked as replied', type: 'success' });
            fetchMessages();
            fetchStats();
        } catch (error: any) {
            setToast({ message: error.message, type: 'error' });
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete this message?')) return;
        try {
            await outreachApi.delete(id);
            setToast({ message: 'Message deleted', type: 'success' });
            fetchMessages();
        } catch (error: any) {
            setToast({ message: error.message, type: 'error' });
        }
    }

    async function handleCompose() {
        if (selectedContacts.length === 0) {
            setToast({ message: 'Select at least one contact', type: 'error' });
            return;
        }

        if (!selectedTemplate && (!customSubject || !customBody)) {
            setToast({ message: 'Select a template or write a custom email', type: 'error' });
            return;
        }

        setSending(true);
        try {
            if (selectedContacts.length === 1 && !selectedTemplate) {
                // Single custom email
                await outreachApi.create({
                    person_id: selectedContacts[0],
                    subject: customSubject,
                    body: customBody,
                });
            } else {
                // Bulk with template
                await outreachApi.createBulk({
                    person_ids: selectedContacts,
                    template_id: selectedTemplate,
                });
            }
            setToast({ message: `Created ${selectedContacts.length} outreach message(s)`, type: 'success' });
            setShowCompose(false);
            setSelectedContacts([]);
            setSelectedTemplate('');
            setCustomSubject('');
            setCustomBody('');
            fetchMessages();
        } catch (error: any) {
            setToast({ message: error.message, type: 'error' });
        } finally {
            setSending(false);
        }
    }

    function applyTemplate(templateId: string) {
        setSelectedTemplate(templateId);
        const template = templates.find((t) => t.id === templateId);
        if (template) {
            setCustomSubject(template.subject);
            setCustomBody(template.body);
        }
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
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title">
                        <Send size={28} style={{ color: 'var(--accent-primary)' }} />
                        Outreach
                    </h1>
                    <p className="page-subtitle">
                        Track and manage your cold email campaigns
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCompose(true)}>
                    <Plus size={18} />
                    Compose
                </button>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid" style={{ marginBottom: 'var(--spacing-lg)' }}>
                {[
                    { label: 'Sent', value: stats?.sent || 0, icon: Send, color: 'var(--accent-primary)' },
                    { label: 'Replied', value: stats?.replied || 0, icon: MessageSquare, color: 'var(--accent-success)' },
                    { label: 'Pending', value: stats?.pending_queue || 0, icon: Clock, color: 'var(--accent-warning)' },
                    { label: 'Bounced', value: stats?.bounced || 0, icon: XCircle, color: 'var(--accent-danger)' },
                ].map((stat) => (
                    <div key={stat.label} className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">{stat.label}</span>
                            <div className="stat-card-icon" style={{ background: `${stat.color}20`, color: stat.color }}>
                                <stat.icon size={20} />
                            </div>
                        </div>
                        <div className="stat-card-value">{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
                    <Filter size={18} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ color: 'var(--text-muted)' }}>Filter by:</span>
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                        {['', 'draft', 'queued', 'sent', 'replied', 'bounced'].map((status) => (
                            <button
                                key={status}
                                className={`toggle-btn ${statusFilter === status ? 'active' : ''}`}
                                onClick={() => {
                                    setStatusFilter(status);
                                    setPage(1);
                                }}
                                style={{ borderRadius: 'var(--radius-full)' }}
                            >
                                {status || 'All'}
                            </button>
                        ))}
                    </div>
                    <div style={{ flex: 1 }} />
                    <button className="btn btn-ghost" onClick={fetchMessages}>
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            {/* Messages Table */}
            {loading ? (
                <div className="card" style={{ padding: 'var(--spacing-2xl)', textAlign: 'center' }}>
                    <div className="spinner spinner-lg" style={{ margin: '0 auto' }} />
                </div>
            ) : messages.length === 0 ? (
                <div className="card empty-state">
                    <div className="empty-state-icon">
                        <Mail size={40} />
                    </div>
                    <h3 className="empty-state-title">No messages yet</h3>
                    <p className="empty-state-description">
                        Start by composing your first outreach email
                    </p>
                    <button className="btn btn-primary" onClick={() => setShowCompose(true)}>
                        <Plus size={18} />
                        Compose Email
                    </button>
                </div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Recipient</th>
                                <th>Subject</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {messages.map((message) => {
                                const statusConfig = STATUS_CONFIG[message.status];
                                const StatusIcon = statusConfig.icon;

                                return (
                                    <tr key={message.id}>
                                        <td>
                                            <div>
                                                <div style={{ fontWeight: 500 }}>{message.full_name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    {message.email_used}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div
                                                style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                            >
                                                {message.subject}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge badge-${statusConfig.color}`}>
                                                <StatusIcon size={12} />
                                                {statusConfig.label}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                                {message.sent_at
                                                    ? new Date(message.sent_at).toLocaleDateString()
                                                    : new Date(message.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => setViewingMessage(message)}
                                                    title="View"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                {(message.status === 'draft' || message.status === 'queued') && (
                                                    <button
                                                        className="btn btn-ghost btn-sm"
                                                        onClick={() => handleSend(message.id)}
                                                        title="Send Now"
                                                        style={{ color: 'var(--accent-primary)' }}
                                                    >
                                                        <Play size={16} />
                                                    </button>
                                                )}
                                                {(message.status === 'queued' || message.status === 'pending') && (
                                                    <button
                                                        className="btn btn-ghost btn-sm"
                                                        onClick={() => handleCancel(message.id)}
                                                        title="Cancel"
                                                    >
                                                        <PauseCircle size={16} />
                                                    </button>
                                                )}
                                                {message.status === 'sent' && (
                                                    <button
                                                        className="btn btn-ghost btn-sm"
                                                        onClick={() => handleMarkReplied(message.id)}
                                                        title="Mark Replied"
                                                        style={{ color: 'var(--accent-success)' }}
                                                    >
                                                        <MessageSquare size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => handleDelete(message.id)}
                                                    title="Delete"
                                                    style={{ color: 'var(--accent-danger)' }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="pagination">
                    <button className="pagination-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>
                        ←
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((p) => (
                        <button
                            key={p}
                            className={`pagination-btn ${page === p ? 'active' : ''}`}
                            onClick={() => setPage(p)}
                        >
                            {p}
                        </button>
                    ))}
                    <button className="pagination-btn" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                        →
                    </button>
                </div>
            )}

            {/* Compose Modal */}
            {showCompose && (
                <div className="modal-overlay" onClick={() => setShowCompose(false)}>
                    <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Compose Email</h3>
                            <button className="modal-close" onClick={() => setShowCompose(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            {/* Select Contacts */}
                            <div className="form-group">
                                <label className="form-label required">Recipients</label>
                                <select
                                    multiple
                                    className="form-select"
                                    value={selectedContacts}
                                    onChange={(e) => {
                                        const selected = Array.from(e.target.selectedOptions, (o) => o.value);
                                        setSelectedContacts(selected);
                                    }}
                                    style={{ height: '120px' }}
                                >
                                    {contacts.map((contact) => (
                                        <option key={contact.id} value={contact.id}>
                                            {contact.full_name} ({contact.primary_email}) - {contact.company_name}
                                        </option>
                                    ))}
                                </select>
                                <p className="form-help">
                                    {selectedContacts.length} contact(s) selected. Hold Ctrl/Cmd to select multiple.
                                </p>
                            </div>

                            {/* Select Template */}
                            <div className="form-group">
                                <label className="form-label">Use Template</label>
                                <select
                                    className="form-select"
                                    value={selectedTemplate}
                                    onChange={(e) => applyTemplate(e.target.value)}
                                >
                                    <option value="">Custom Email</option>
                                    {templates.map((template) => (
                                        <option key={template.id} value={template.id}>
                                            {template.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Subject & Body */}
                            <div className="form-group">
                                <label className="form-label required">Subject</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={customSubject}
                                    onChange={(e) => setCustomSubject(e.target.value)}
                                    placeholder="Email subject..."
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label required">Body</label>
                                <textarea
                                    className="form-textarea"
                                    value={customBody}
                                    onChange={(e) => setCustomBody(e.target.value)}
                                    placeholder="Write your email..."
                                    rows={10}
                                />
                                <p className="form-help">
                                    Variables: {'{{first_name}}'}, {'{{company_name}}'}, {'{{role}}'}, {'{{my_service_summary}}'},
                                    {'{{opt_out_text}}'}
                                </p>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowCompose(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleCompose} disabled={sending}>
                                {sending ? <span className="spinner" /> : <Send size={18} />}
                                Queue {selectedContacts.length} Email{selectedContacts.length !== 1 ? 's' : ''}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Message Modal */}
            {viewingMessage && (
                <div className="modal-overlay" onClick={() => setViewingMessage(null)}>
                    <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Message Details</h3>
                            <button className="modal-close" onClick={() => setViewingMessage(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                <strong>To:</strong> {viewingMessage.full_name} &lt;{viewingMessage.email_used}&gt;
                            </div>
                            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                <strong>Subject:</strong> {viewingMessage.subject}
                            </div>
                            <div
                                style={{
                                    padding: 'var(--spacing-lg)',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: 'var(--radius-md)',
                                    whiteSpace: 'pre-wrap',
                                }}
                            >
                                {viewingMessage.body}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setViewingMessage(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
