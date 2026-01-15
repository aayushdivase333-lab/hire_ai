'use client';

import { useState, useRef } from 'react';
import {
    FileText,
    Upload,
    Trash2,
    Download,
    File,
    FileImage,
    FileSpreadsheet,
    Eye,
    Plus,
    Paperclip,
} from 'lucide-react';

interface Document {
    id: string;
    name: string;
    size: number;
    type: string;
    uploadedAt: string;
    attachToEmails: boolean;
}

// Since we don't have file upload on backend yet, we'll use localStorage
function getStoredDocuments(): Document[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('leadfinder_documents');
    return stored ? JSON.parse(stored) : [];
}

function storeDocuments(docs: Document[]) {
    localStorage.setItem('leadfinder_documents', JSON.stringify(docs));
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getFileIcon(type: string) {
    if (type.includes('image')) return FileImage;
    if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) return FileSpreadsheet;
    return FileText;
}

export default function DocumentsPage() {
    const [documents, setDocuments] = useState<Document[]>(getStoredDocuments);
    const fileInputRef = useRef<HTMLInputElement>(null);

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const files = e.target.files;
        if (!files) return;

        const newDocs: Document[] = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            newDocs.push({
                id: `doc-${Date.now()}-${i}`,
                name: file.name,
                size: file.size,
                type: file.type,
                uploadedAt: new Date().toISOString(),
                attachToEmails: false,
            });
        }

        const updated = [...documents, ...newDocs];
        setDocuments(updated);
        storeDocuments(updated);

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }

    function deleteDocument(id: string) {
        const updated = documents.filter((d) => d.id !== id);
        setDocuments(updated);
        storeDocuments(updated);
    }

    function toggleAttach(id: string) {
        const updated = documents.map((d) =>
            d.id === id ? { ...d, attachToEmails: !d.attachToEmails } : d
        );
        setDocuments(updated);
        storeDocuments(updated);
    }

    const attachedDocs = documents.filter((d) => d.attachToEmails);

    return (
        <div className="container">
            {/* Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title">
                        <FileText size={28} style={{ color: 'var(--accent-primary)' }} />
                        Documents
                    </h1>
                    <p className="page-subtitle">
                        Upload documents to attach to your outreach emails (portfolios, case studies, etc.)
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
                    <Upload size={18} />
                    Upload Document
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.xls,.xlsx,.csv"
                    style={{ display: 'none' }}
                />
            </div>

            {/* Attached Documents Summary */}
            {attachedDocs.length > 0 && (
                <div className="card" style={{ marginBottom: 'var(--spacing-lg)', background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, var(--bg-card) 50%)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                        <Paperclip size={20} style={{ color: 'var(--accent-primary)' }} />
                        <span>
                            <strong>{attachedDocs.length}</strong> document{attachedDocs.length !== 1 ? 's' : ''} will be attached to outreach emails:
                        </span>
                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
                            {attachedDocs.map((doc) => (
                                <span key={doc.id} className="badge badge-primary">
                                    {doc.name}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Upload Area */}
            {documents.length === 0 && (
                <div
                    className="file-upload"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ marginBottom: 'var(--spacing-lg)' }}
                >
                    <Upload className="file-upload-icon" />
                    <p className="file-upload-text">
                        <strong>Click to upload</strong> or drag and drop
                    </p>
                    <p className="file-upload-hint">
                        PDF, DOC, DOCX, TXT, PNG, JPG, XLS, XLSX (max 10MB)
                    </p>
                </div>
            )}

            {/* Documents List */}
            {documents.length > 0 && (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Document</th>
                                <th>Size</th>
                                <th>Uploaded</th>
                                <th>Attach to Emails</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {documents.map((doc) => {
                                const Icon = getFileIcon(doc.type);
                                return (
                                    <tr key={doc.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                                <div
                                                    style={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: 'var(--radius-md)',
                                                        background: 'var(--bg-tertiary)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    <Icon size={20} style={{ color: 'var(--accent-primary)' }} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 500 }}>{doc.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                        {doc.type || 'Unknown type'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ color: 'var(--text-muted)' }}>{formatFileSize(doc.size)}</span>
                                        </td>
                                        <td>
                                            <span style={{ color: 'var(--text-muted)' }}>
                                                {new Date(doc.uploadedAt).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td>
                                            <label
                                                className={`form-checkbox-item ${doc.attachToEmails ? 'selected' : ''}`}
                                                style={{ display: 'inline-flex', cursor: 'pointer' }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={doc.attachToEmails}
                                                    onChange={() => toggleAttach(doc.id)}
                                                />
                                                {doc.attachToEmails ? 'Attached' : 'Not attached'}
                                            </label>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                                                <button className="btn btn-ghost btn-sm" title="Preview">
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => deleteDocument(doc.id)}
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

            {/* Add More Button */}
            {documents.length > 0 && (
                <div style={{ marginTop: 'var(--spacing-lg)' }}>
                    <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
                        <Plus size={18} />
                        Add More Documents
                    </button>
                </div>
            )}

            {/* Info Card */}
            <div className="card" style={{ marginTop: 'var(--spacing-xl)', background: 'var(--bg-tertiary)' }}>
                <h4 style={{ marginBottom: 'var(--spacing-md)' }}>📎 How Document Attachments Work</h4>
                <ul style={{ color: 'var(--text-muted)', paddingLeft: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                    <li>Documents marked as "Attached" will be included with all outreach emails</li>
                    <li>Keep attachments small (under 5MB) for better deliverability</li>
                    <li>PDFs work best for compatibility across email clients</li>
                    <li>You can attach portfolio samples, case studies, or rate cards</li>
                </ul>
            </div>
        </div>
    );
}
