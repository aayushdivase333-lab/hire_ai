'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Building2,
    Users,
    Search,
    Mail,
    Send,
    FileText,
    User,
    Settings,
    LogOut,
    Sun,
    Zap,
} from 'lucide-react';

const navItems = [
    { href: '/', label: 'Overview', icon: LayoutDashboard },
    { href: '/discover', label: 'Discover', icon: Search },
    { href: '/companies', label: 'Companies', icon: Building2 },
    { href: '/contacts', label: 'Contacts', icon: Users },
    { href: '/templates', label: 'Templates', icon: FileText },
    { href: '/outreach', label: 'Outreach', icon: Send },
    { href: '/documents', label: 'Documents', icon: Mail },
    { href: '/profile', label: 'Profile', icon: User },
];

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
                        Lead<span>Gen</span>
                    </div>
                </Link>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href ||
                        (item.href !== '/' && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`nav-item ${isActive ? 'active' : ''}`}
                        >
                            <Icon size={20} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
                <Link href="/settings" className="sidebar-footer-item">
                    <Settings size={18} />
                    <span>Settings</span>
                </Link>
                <div className="sidebar-footer-item">
                    <Sun size={18} />
                    <span>Light Mode</span>
                </div>
                <div className="sidebar-footer-item">
                    <LogOut size={18} />
                    <span>Sign Out</span>
                </div>
            </div>
        </aside>
    );
}
