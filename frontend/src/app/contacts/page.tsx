'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
    Users,
    Plus,
    Search,
    Mail,
    MoreVertical,
    Trash2,
    Edit,
    UserX,
    Linkedin,
    Building2,
    Filter,
    CheckCircle,
    AlertCircle,
    ExternalLink,
    RefreshCw,
} from 'lucide-react';
import { peopleApi, companiesApi } from '@/lib/api';

interface Contact {
    id: string;
    company_id: string;
    full_name: string;
    first_name: string;
    last_name: string;
    title: string | null;
    linkedin_url: string | null;
    location: string | null;
    do_not_contact: boolean;
    seniority_tag: string | null;
    company_name: string | null;
    company_domain: string | null;
    primary_email: string | null;
    email_count: number;
}

interface Company {
    id: string;
    name: string;
}

export default function ContactsPage() {
    const searchParams = useSearchParams();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [selectedCompany, setSelectedCompany] = useState(searchParams.get('company_id') || '');
    const [showModal, setShowModal] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [actionMenuId, setActionMenuId] = useState<string | null>(null);

    // Check for saved notification
    const savedCount = searchParams.get('saved');

    useEffect(() => {
        fetchContacts();
        fetchCompanies();
    }, [page, search, selectedCompany]);

    useEffect(() => {
        if (savedCount) {
            setToast({ message: `Successfully added ${savedCount} contacts!`, type: 'success' });
        }
    }, [savedCount]);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    async function fetchContacts() {
        setLoading(true);
        try {
            const result = await peopleApi.list({
                page,
                search,
                company_id: selectedCompany || undefined,
            }) as any;
            if (result.success) {
                setContacts(result.data.items);
                setTotalPages(result.data.totalPages);
            }
        } catch (error: any) {
            setToast({ message: error.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    }

    async function fetchCompanies() {
        try {
            const result = await companiesApi.list() as any;
            if (result.success) {
                setCompanies(result.data.items);
            }
        } catch (error) {
            console.error('Failed to fetch companies:', error);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this contact?')) return;
        try {
            await peopleApi.delete(id);
            setToast({ message: 'Contact deleted', type: 'success' });
            fetchContacts();
        } catch (error: any) {
            setToast({ message: error.message, type: 'error' });
        }
    }

    async function handleDoNotContact(id: string) {
        try {
            await peopleApi.markDoNotContact(id);
            setToast({ message: 'Marked as do not contact', type: 'success' });
            fetchContacts();
        } catch (error: any) {
            setToast({ message: error.message, type: 'error' });
        }
    }

    async function handleGenerateEmails(id: string) {
        try {
            await peopleApi.generateEmails(id);
            setToast({ message: 'Emails generated', type: 'success' });
            fetchContacts();
        } catch (error: any) {
            setToast({ message: error.message, type: 'error' });
        }
    }

    function getInitials(name: string) {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
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
                        <Users size={28} style={{ color: 'var(--accent-primary)' }} />
                        Contacts
                    </h1>
                    <p className="page-subtitle">
                        {contacts.length} contacts across {companies.length} companies
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <Link href="/discover" className="btn btn-primary">
                        <Plus size={18} />
                        Discover Contacts
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
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
                            placeholder="Search contacts..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            style={{ paddingLeft: '44px' }}
                        />
                    </div>
                    <select
                        className="form-select"
                        value={selectedCompany}
                        onChange={(e) => {
                            setSelectedCompany(e.target.value);
                            setPage(1);
                        }}
                        style={{ width: '200px' }}
                    >
                        <option value="">All Companies</option>
                        {companies.map((company) => (
                            <option key={company.id} value={company.id}>
                                {company.name}
                            </option>
                        ))}
                    </select>
                    <button className="btn btn-ghost" onClick={fetchContacts}>
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            {/* Contacts Table */}
            {loading ? (
                <div className="card" style={{ padding: 'var(--spacing-2xl)', textAlign: 'center' }}>
                    <div className="spinner spinner-lg" style={{ margin: '0 auto' }} />
                    <p style={{ marginTop: 'var(--spacing-md)', color: 'var(--text-muted)' }}>Loading contacts...</p>
                </div>
            ) : contacts.length === 0 ? (
                <div className="card empty-state">
                    <div className="empty-state-icon">
                        <Users size={40} />
                    </div>
                    <h3 className="empty-state-title">No contacts found</h3>
                    <p className="empty-state-description">
                        Start by discovering contacts at target companies
                    </p>
                    <Link href="/discover" className="btn btn-primary">
                        <Plus size={18} />
                        Discover Contacts
                    </Link>
                </div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Contact</th>
                                <th>Company</th>
                                <th>Title</th>
                                <th>Email</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {contacts.map((contact) => (
                                <tr key={contact.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                            <div
                                                style={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: 'var(--radius-full)',
                                                    background: contact.do_not_contact ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: contact.do_not_contact ? 'var(--text-muted)' : 'white',
                                                    fontWeight: 600,
                                                    fontSize: '0.875rem',
                                                }}
                                            >
                                                {getInitials(contact.full_name)}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    {contact.full_name}
                                                    {contact.linkedin_url && (
                                                        <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer">
                                                            <Linkedin size={14} style={{ color: 'var(--accent-info)' }} />
                                                        </a>
                                                    )}
                                                </div>
                                                {contact.location && (
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                        {contact.location}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        {contact.company_name ? (
                                            <Link
                                                href={`/companies?id=${contact.company_id}`}
                                                style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                <Building2 size={14} />
                                                {contact.company_name}
                                            </Link>
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                                        )}
                                    </td>
                                    <td>
                                        <span style={{ color: 'var(--text-secondary)' }}>
                                            {contact.title || '—'}
                                        </span>
                                    </td>
                                    <td>
                                        {contact.primary_email ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span className="badge badge-success">
                                                    <Mail size={12} />
                                                    {contact.primary_email}
                                                </span>
                                            </div>
                                        ) : contact.company_domain ? (
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => handleGenerateEmails(contact.id)}
                                                style={{ color: 'var(--accent-primary)' }}
                                            >
                                                <Mail size={14} />
                                                Generate Email
                                            </button>
                                        ) : (
                                            <span className="badge badge-gray">No domain</span>
                                        )}
                                    </td>
                                    <td>
                                        {contact.do_not_contact ? (
                                            <span className="badge badge-danger">
                                                <UserX size={12} />
                                                Do Not Contact
                                            </span>
                                        ) : contact.primary_email ? (
                                            <span className="badge badge-success">Ready</span>
                                        ) : (
                                            <span className="badge badge-warning">Needs Email</span>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ position: 'relative' }}>
                                            <button
                                                className="btn btn-ghost btn-icon"
                                                onClick={() => setActionMenuId(actionMenuId === contact.id ? null : contact.id)}
                                            >
                                                <MoreVertical size={18} />
                                            </button>
                                            {actionMenuId === contact.id && (
                                                <div
                                                    style={{
                                                        position: 'absolute',
                                                        right: 0,
                                                        top: '100%',
                                                        background: 'var(--bg-secondary)',
                                                        border: '1px solid var(--border-color)',
                                                        borderRadius: 'var(--radius-md)',
                                                        minWidth: '160px',
                                                        zIndex: 100,
                                                        boxShadow: 'var(--shadow-lg)',
                                                    }}
                                                >
                                                    <Link
                                                        href={`/outreach?contact_id=${contact.id}`}
                                                        className="nav-item"
                                                        style={{ borderRadius: 0 }}
                                                        onClick={() => setActionMenuId(null)}
                                                    >
                                                        <Mail size={16} />
                                                        Send Email
                                                    </Link>
                                                    {!contact.do_not_contact && (
                                                        <button
                                                            className="nav-item"
                                                            style={{ width: '100%', borderRadius: 0 }}
                                                            onClick={() => {
                                                                handleDoNotContact(contact.id);
                                                                setActionMenuId(null);
                                                            }}
                                                        >
                                                            <UserX size={16} />
                                                            Mark DNC
                                                        </button>
                                                    )}
                                                    <button
                                                        className="nav-item"
                                                        style={{ width: '100%', borderRadius: 0, color: 'var(--accent-danger)' }}
                                                        onClick={() => {
                                                            handleDelete(contact.id);
                                                            setActionMenuId(null);
                                                        }}
                                                    >
                                                        <Trash2 size={16} />
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        className="pagination-btn"
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                    >
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
                    <button
                        className="pagination-btn"
                        disabled={page === totalPages}
                        onClick={() => setPage(page + 1)}
                    >
                        →
                    </button>
                </div>
            )}
        </div>
    );
}
