'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Zap,
    Send,
    History,
    Settings,
    HelpCircle,
    Sun,
} from 'lucide-react';

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <Link href="/" className="sidebar-logo">
                    <div className="sidebar-logo-icon">
                        <Zap size={20} />
                    </div>
                    <div className="sidebar-logo-text">
                        Out<span>reach</span>
                    </div>
                </Link>
            </div>

            <nav className="sidebar-nav">
                <Link
                    href="/"
                    className={`nav-item ${pathname === '/' ? 'active' : ''}`}
                >
                    <Send size={20} />
                    <span>New Outreach</span>
                </Link>
                <Link
                    href="/history"
                    className={`nav-item ${pathname === '/history' ? 'active' : ''}`}
                >
                    <History size={20} />
                    <span>History</span>
                </Link>
                <Link
                    href="/settings"
                    className={`nav-item ${pathname === '/settings' ? 'active' : ''}`}
                >
                    <Settings size={20} />
                    <span>Settings</span>
                </Link>
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-footer-item">
                    <HelpCircle size={18} />
                    <span>Help</span>
                </div>
                <div className="sidebar-footer-item">
                    <Sun size={18} />
                    <span>Light Mode</span>
                </div>
            </div>
        </aside>
    );
}
