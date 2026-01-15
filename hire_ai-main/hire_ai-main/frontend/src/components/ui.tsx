'use client';

import { ReactNode, useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';

// Modal Component
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
    size?: 'sm' | 'md' | 'lg';
}

export function Modal({ isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const maxWidth = {
        sm: '400px',
        md: '600px',
        lg: '800px',
    }[size];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal"
                style={{ maxWidth }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h3 className="modal-title">{title}</h3>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <div className="modal-body">{children}</div>
                {footer && <div className="modal-footer">{footer}</div>}
            </div>
        </div>
    );
}

// Toast/Alert Component
interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info' | 'warning';
    onClose: () => void;
}

export function Toast({ message, type = 'info', onClose }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const icons = {
        success: <CheckCircle size={18} />,
        error: <AlertCircle size={18} />,
        info: <Info size={18} />,
        warning: <AlertCircle size={18} />,
    };

    const colors = {
        success: 'var(--accent-success)',
        error: 'var(--accent-danger)',
        info: 'var(--accent-info)',
        warning: 'var(--accent-warning)',
    };

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                background: 'var(--bg-card)',
                border: `1px solid ${colors[type]}`,
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--spacing-md) var(--spacing-lg)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-md)',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 1001,
                animation: 'slideUp 0.3s ease',
            }}
        >
            <span style={{ color: colors[type] }}>{icons[type]}</span>
            <span style={{ color: 'var(--text-primary)' }}>{message}</span>
            <button
                onClick={onClose}
                style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 'var(--spacing-xs)',
                }}
            >
                <X size={16} />
            </button>
        </div>
    );
}

// Confirmation Dialog
interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    confirmVariant?: 'primary' | 'danger';
    loading?: boolean;
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    confirmVariant = 'primary',
    loading = false,
}: ConfirmDialogProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="sm"
            footer={
                <>
                    <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
                        Cancel
                    </button>
                    <button
                        className={`btn btn-${confirmVariant}`}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? <span className="spinner" /> : confirmText}
                    </button>
                </>
            }
        >
            <p style={{ color: 'var(--text-secondary)' }}>{message}</p>
        </Modal>
    );
}

// Loading Spinner
export function Spinner({ size = 20 }: { size?: number }) {
    return (
        <div
            className="spinner"
            style={{ width: size, height: size }}
        />
    );
}

// Empty State
interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="empty-state">
            {icon && <div className="empty-state-icon">{icon}</div>}
            <h4 className="empty-state-title">{title}</h4>
            {description && <p className="empty-state-text">{description}</p>}
            {action}
        </div>
    );
}

// Badge Component
interface BadgeProps {
    children: ReactNode;
    variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'gray';
}

export function Badge({ children, variant = 'gray' }: BadgeProps) {
    return <span className={`badge badge-${variant}`}>{children}</span>;
}

// Confidence Badge
export function ConfidenceBadge({ level }: { level: string }) {
    const variant = {
        high: 'success',
        medium: 'warning',
        low: 'danger',
        unknown: 'gray',
    }[level] || 'gray';

    return <Badge variant={variant as any}>{level}</Badge>;
}

// Status Badge
export function StatusBadge({ status }: { status: string }) {
    const variants: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'gray'> = {
        draft: 'gray',
        queued: 'info',
        pending: 'warning',
        sent: 'primary',
        delivered: 'success',
        opened: 'success',
        replied: 'success',
        bounced: 'danger',
        failed: 'danger',
        do_not_contact: 'danger',
    };

    return <Badge variant={variants[status] || 'gray'}>{status.replace(/_/g, ' ')}</Badge>;
}

// Pagination Component
interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
        pages.push(i);
    }

    return (
        <div style={{ display: 'flex', gap: 'var(--spacing-xs)', justifyContent: 'center', marginTop: 'var(--spacing-lg)' }}>
            <button
                className="btn btn-ghost btn-sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
            >
                Previous
            </button>

            {start > 1 && (
                <>
                    <button className="btn btn-ghost btn-sm" onClick={() => onPageChange(1)}>1</button>
                    {start > 2 && <span style={{ padding: '0 var(--spacing-sm)' }}>...</span>}
                </>
            )}

            {pages.map((page) => (
                <button
                    key={page}
                    className={`btn btn-sm ${page === currentPage ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => onPageChange(page)}
                >
                    {page}
                </button>
            ))}

            {end < totalPages && (
                <>
                    {end < totalPages - 1 && <span style={{ padding: '0 var(--spacing-sm)' }}>...</span>}
                    <button className="btn btn-ghost btn-sm" onClick={() => onPageChange(totalPages)}>
                        {totalPages}
                    </button>
                </>
            )}

            <button
                className="btn btn-ghost btn-sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
            >
                Next
            </button>
        </div>
    );
}
