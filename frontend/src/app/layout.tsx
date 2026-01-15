import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';
import Sidebar from '@/components/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Lead Finder - Privacy-First Cold Email System',
    description: 'Find leads and send personalized cold emails for boutique firms and family offices.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <Sidebar />
                <main className="main-content">{children}</main>
            </body>
        </html>
    );
}
