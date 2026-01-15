'use client';

import { useState, useEffect } from 'react';
import {
    FileText,
    Plus,
    Edit,
    Trash2,
    Copy,
    Eye,
    CheckCircle,
    AlertCircle,
    X,
} from 'lucide-react';
import { templatesApi } from '@/lib/api';

interface Template {
    id: string;
    name: string;
    subject: string;
    body: string;
    template_type: string;
    offer_type: string;
    is_active: boolean;
    created_at: string;
}

const OFFER_TYPES = [
    { value: 'website_support', label: 'Website Support' },
    { value: 'automation', label: 'Automation & Dashboards' },
    { value: 'technical_support', label: 'Technical Support' },
    { value: 'general', label: 'General' },
];

const TEMPLATE_TYPES = [
    { value: 'first_touch', label: 'First Touch' },
    { value: 'follow_up_1', label: 'Follow Up 1' },
    { value: 'follow_up_2', label: 'Follow Up 2' },
    { value: 'break_up', label: 'Final Touch' },
];

const VARIABLES = [
    { var: '{{first_name}}', desc: 'Contact first name' },
    { var: '{{last_name}}', desc: 'Contact last name' },
    { var: '{{full_name}}', desc: 'Contact full name' },
    { var: '{{company_name}}', desc: 'Company name' },
    { var: '{{role}}', desc: 'Contact job title' },
    { var: '{{my_name}}', desc: 'Your name (from profile)' },
    { var: '{{my_service_summary}}', desc: 'Your pitch (from profile)' },
    { var: '{{opt_out_text}}', desc: 'CAN-SPAM opt-out line' },
];

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<string>('');
    const [showModal, setShowModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
    const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        subject: '',
        body: '',
        template_type: 'first_touch',
        offer_type: 'website_support',
    });

    useEffect(() => {
        fetchTemplates();
    }, [filterType]);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    async function fetchTemplates() {
        setLoading(true);
        try {
            const result = await templatesApi.list({
                offer_type: filterType || undefined,
            }) as any;
            if (result.success) {
                setTemplates(result.data);
            }
        } catch (error: any) {
            setToast({ message: error.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit() {
        if (!formData.name || !formData.subject || !formData.body) {
            setToast({ message: 'Name, subject, and body are required', type: 'error' });
            return;
        }

        try {
            if (editingTemplate) {
                await templatesApi.update(editingTemplate.id, formData);
                setToast({ message: 'Template updated', type: 'success' });
            } else {
                await templatesApi.create(formData);
                setToast({ message: 'Template created', type: 'success' });
            }
            setShowModal(false);
            setEditingTemplate(null);
            resetForm();
            fetchTemplates();
        } catch (error: any) {
            setToast({ message: error.message, type: 'error' });
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete this template?')) return;
        try {
            await templatesApi.delete(id);
            setToast({ message: 'Template deleted', type: 'success' });
            fetchTemplates();
        } catch (error: any) {
            setToast({ message: error.message, type: 'error' });
        }
    }

    async function handleDuplicate(template: Template) {
        try {
            await templatesApi.duplicate(template.id);
            setToast({ message: 'Template duplicated', type: 'success' });
            fetchTemplates();
        } catch (error: any) {
            setToast({ message: error.message, type: 'error' });
        }
    }

    function openEdit(template: Template) {
        setEditingTemplate(template);
        setFormData({
            name: template.name,
            subject: template.subject,
            body: template.body,
            template_type: template.template_type,
            offer_type: template.offer_type,
        });
        setShowModal(true);
    }

    function resetForm() {
        setFormData({
            name: '',
            subject: '',
            body: '',
            template_type: 'first_touch',
            offer_type: 'website_support',
        });
    }

    // Preview with sample data
    function getPreviewContent(text: string) {
        return text
            .replace(/\{\{first_name\}\}/g, 'John')
            .replace(/\{\{last_name\}\}/g, 'Smith')
            .replace(/\{\{full_name\}\}/g, 'John Smith')
            .replace(/\{\{company_name\}\}/g, 'Acme Capital')
            .replace(/\{\{role\}\}/g, 'Managing Partner')
            .replace(/\{\{my_name\}\}/g, 'Your Name')
            .replace(/\{\{my_service_summary\}\}/g, 'I help firms modernize their digital presence with custom websites and automation.')
            .replace(/\{\{opt_out_text\}\}/g, '(If you\'d prefer not to receive future emails, just reply with "no" and I\'ll remove you from my list.)');
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
                        <FileText size={28} style={{ color: 'var(--accent-primary)' }} />
                        Email Templates
                    </h1>
                    <p className="page-subtitle">
                        Create and manage your email templates with personalization variables
                    </p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        setEditingTemplate(null);
                        resetForm();
                        setShowModal(true);
                    }}
                >
                    <Plus size={18} />
                    New Template
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="tabs" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <button
                    className={`tab ${filterType === '' ? 'active' : ''}`}
                    onClick={() => setFilterType('')}
                >
                    All Templates
                </button>
                {OFFER_TYPES.map((type) => (
                    <button
                        key={type.value}
                        className={`tab ${filterType === type.value ? 'active' : ''}`}
                        onClick={() => setFilterType(type.value)}
                    >
                        {type.label}
                    </button>
                ))}
            </div>

            {/* Templates Grid */}
            {loading ? (
                <div className="card" style={{ padding: 'var(--spacing-2xl)', textAlign: 'center' }}>
                    <div className="spinner spinner-lg" style={{ margin: '0 auto' }} />
                </div>
            ) : templates.length === 0 ? (
                <div className="card empty-state">
                    <div className="empty-state-icon">
                        <FileText size={40} />
                    </div>
                    <h3 className="empty-state-title">No templates yet</h3>
                    <p className="empty-state-description">
                        Create your first email template to start sending personalized outreach
                    </p>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={18} />
                        New Template
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 'var(--spacing-md)' }}>
                    {templates.map((template) => (
                        <div key={template.id} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-md)' }}>
                                <div>
                                    <h3 style={{ marginBottom: '4px' }}>{template.name}</h3>
                                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                        <span className="badge badge-primary">
                                            {OFFER_TYPES.find((t) => t.value === template.offer_type)?.label}
                                        </span>
                                        <span className="badge badge-gray">
                                            {TEMPLATE_TYPES.find((t) => t.value === template.template_type)?.label}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                <div style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px' }}>Subject:</div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {template.subject}
                                </div>
                            </div>

                            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                <div style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px' }}>Preview:</div>
                                <div
                                    style={{
                                        fontSize: '0.8125rem',
                                        color: 'var(--text-muted)',
                                        padding: 'var(--spacing-sm)',
                                        background: 'var(--bg-tertiary)',
                                        borderRadius: 'var(--radius-sm)',
                                        maxHeight: '80px',
                                        overflow: 'hidden',
                                    }}
                                >
                                    {template.body.slice(0, 150)}...
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                <button className="btn btn-secondary btn-sm" onClick={() => setPreviewTemplate(template)}>
                                    <Eye size={14} />
                                    Preview
                                </button>
                                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(template)}>
                                    <Edit size={14} />
                                    Edit
                                </button>
                                <button className="btn btn-ghost btn-sm" onClick={() => handleDuplicate(template)}>
                                    <Copy size={14} />
                                    Copy
                                </button>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => handleDelete(template.id)}
                                    style={{ color: 'var(--accent-danger)' }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Variables Reference */}
            <div className="card" style={{ marginTop: 'var(--spacing-xl)' }}>
                <h4 style={{ marginBottom: 'var(--spacing-md)' }}>📋 Available Variables</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--spacing-sm)' }}>
                    {VARIABLES.map((v) => (
                        <div
                            key={v.var}
                            style={{
                                padding: 'var(--spacing-sm) var(--spacing-md)',
                                background: 'var(--bg-tertiary)',
                                borderRadius: 'var(--radius-sm)',
                            }}
                        >
                            <code style={{ color: 'var(--accent-primary)', fontSize: '0.8125rem' }}>{v.var}</code>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.desc}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editingTemplate ? 'Edit Template' : 'New Template'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                <div className="form-group">
                                    <label className="form-label required">Template Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Website Support - First Touch"
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                    <div className="form-group">
                                        <label className="form-label">Offer Type</label>
                                        <select
                                            className="form-select"
                                            value={formData.offer_type}
                                            onChange={(e) => setFormData({ ...formData, offer_type: e.target.value })}
                                        >
                                            {OFFER_TYPES.map((type) => (
                                                <option key={type.value} value={type.value}>
                                                    {type.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Type</label>
                                        <select
                                            className="form-select"
                                            value={formData.template_type}
                                            onChange={(e) => setFormData({ ...formData, template_type: e.target.value })}
                                        >
                                            {TEMPLATE_TYPES.map((type) => (
                                                <option key={type.value} value={type.value}>
                                                    {type.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label required">Subject Line</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    placeholder="Quick question about {{company_name}}'s website"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label required">Email Body</label>
                                <textarea
                                    className="form-textarea"
                                    value={formData.body}
                                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                                    placeholder="Hi {{first_name}},&#10;&#10;I noticed {{company_name}}..."
                                    rows={12}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleSubmit}>
                                {editingTemplate ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {previewTemplate && (
                <div className="modal-overlay" onClick={() => setPreviewTemplate(null)}>
                    <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Preview: {previewTemplate.name}</h3>
                            <button className="modal-close" onClick={() => setPreviewTemplate(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                <strong>Subject:</strong> {getPreviewContent(previewTemplate.subject)}
                            </div>
                            <div
                                style={{
                                    padding: 'var(--spacing-lg)',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: 'var(--radius-md)',
                                    whiteSpace: 'pre-wrap',
                                }}
                            >
                                {getPreviewContent(previewTemplate.body)}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setPreviewTemplate(null)}>
                                Close
                            </button>
                            <button className="btn btn-primary" onClick={() => { openEdit(previewTemplate); setPreviewTemplate(null); }}>
                                <Edit size={16} />
                                Edit Template
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
