'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Building2,
    Plus,
    Search,
    Globe,
    Users,
    Trash2,
    Edit,
    MoreVertical,
    CheckCircle,
    AlertCircle,
    ExternalLink,
    RefreshCw,
    Mail,
} from 'lucide-react';
import { companiesApi } from '@/lib/api';

interface Company {
    id: string;
    name: string;
    domain: string | null;
    website_url: string | null;
    industry: string | null;
    location: string | null;
    notes: string | null;
    people_count: number;
    created_at: string;
}

export default function CompaniesPage() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        website_url: '',
        industry: '',
        location: '',
        notes: '',
    });

    useEffect(() => {
        fetchCompanies();
    }, [page, search]);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    async function fetchCompanies() {
        setLoading(true);
        try {
            const result = await companiesApi.list({ page, search }) as any;
            if (result.success) {
                setCompanies(result.data.items);
                setTotalPages(result.data.totalPages);
            }
        } catch (error: any) {
            setToast({ message: error.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit() {
        if (!formData.name.trim()) {
            setToast({ message: 'Company name is required', type: 'error' });
            return;
        }

        try {
            if (editingCompany) {
                await companiesApi.update(editingCompany.id, formData);
                setToast({ message: 'Company updated', type: 'success' });
            } else {
                await companiesApi.create(formData);
                setToast({ message: 'Company created', type: 'success' });
            }
            setShowModal(false);
            setEditingCompany(null);
            resetForm();
            fetchCompanies();
        } catch (error: any) {
            setToast({ message: error.message, type: 'error' });
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete this company and all its contacts?')) return;
        try {
            await companiesApi.delete(id);
            setToast({ message: 'Company deleted', type: 'success' });
            fetchCompanies();
        } catch (error: any) {
            setToast({ message: error.message, type: 'error' });
        }
    }

    function openEdit(company: Company) {
        setEditingCompany(company);
        setFormData({
            name: company.name,
            website_url: company.website_url || '',
            industry: company.industry || '',
            location: company.location || '',
            notes: company.notes || '',
        });
        setShowModal(true);
    }

    function resetForm() {
        setFormData({
            name: '',
            website_url: '',
            industry: '',
            location: '',
            notes: '',
        });
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
                        <Building2 size={28} style={{ color: 'var(--accent-primary)' }} />
                        Companies
                    </h1>
                    <p className="page-subtitle">
                        Manage your target companies
                    </p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        setEditingCompany(null);
                        resetForm();
                        setShowModal(true);
                    }}
                >
                    <Plus size={18} />
                    Add Company
                </button>
            </div>

            {/* Search */}
            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
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
                            placeholder="Search companies..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            style={{ paddingLeft: '44px' }}
                        />
                    </div>
                    <button className="btn btn-ghost" onClick={fetchCompanies}>
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            {/* Companies Grid */}
            {loading ? (
                <div className="card" style={{ padding: 'var(--spacing-2xl)', textAlign: 'center' }}>
                    <div className="spinner spinner-lg" style={{ margin: '0 auto' }} />
                </div>
            ) : companies.length === 0 ? (
                <div className="card empty-state">
                    <div className="empty-state-icon">
                        <Building2 size={40} />
                    </div>
                    <h3 className="empty-state-title">No companies yet</h3>
                    <p className="empty-state-description">
                        Add companies to start discovering contacts
                    </p>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={18} />
                        Add Company
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--spacing-md)' }}>
                    {companies.map((company) => (
                        <div key={company.id} className="card card-glow" style={{ padding: 'var(--spacing-lg)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-md)' }}>
                                <div>
                                    <h3 style={{ marginBottom: '4px', fontSize: '1.125rem' }}>{company.name}</h3>
                                    {company.domain && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                            <Globe size={14} />
                                            {company.domain}
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                                    <button className="btn btn-ghost btn-icon" onClick={() => openEdit(company)}>
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        className="btn btn-ghost btn-icon"
                                        onClick={() => handleDelete(company.id)}
                                        style={{ color: 'var(--accent-danger)' }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-md)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Users size={16} style={{ color: 'var(--text-muted)' }} />
                                    <span style={{ fontWeight: 600 }}>{company.people_count || 0}</span>
                                    <span style={{ color: 'var(--text-muted)' }}>contacts</span>
                                </div>
                                {company.domain && (
                                    <span className="badge badge-success">
                                        <Mail size={12} />
                                        Email Ready
                                    </span>
                                )}
                            </div>

                            {company.industry && (
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-sm)' }}>
                                    {company.industry}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)' }}>
                                <Link
                                    href={`/discover?company=${encodeURIComponent(company.name)}`}
                                    className="btn btn-secondary btn-sm"
                                    style={{ flex: 1, justifyContent: 'center' }}
                                >
                                    Find Contacts
                                </Link>
                                <Link
                                    href={`/contacts?company_id=${company.id}`}
                                    className="btn btn-ghost btn-sm"
                                    style={{ flex: 1, justifyContent: 'center' }}
                                >
                                    View Contacts
                                </Link>
                            </div>
                        </div>
                    ))}
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

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editingCompany ? 'Edit Company' : 'Add Company'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label required">Company Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Blackstone"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Website</label>
                                <input
                                    type="url"
                                    className="form-input"
                                    value={formData.website_url}
                                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                                    placeholder="https://example.com"
                                />
                                <p className="form-help">We'll extract the domain for email generation</p>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                <div className="form-group">
                                    <label className="form-label">Industry</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.industry}
                                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                        placeholder="e.g., Private Equity"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Location</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        placeholder="e.g., New York, NY"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Notes</label>
                                <textarea
                                    className="form-textarea"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Any notes about this company..."
                                    rows={3}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleSubmit}>
                                {editingCompany ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
