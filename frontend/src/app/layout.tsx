import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';
import Sidebar from '@/components/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Outreach - Simple Cold Email Tool',
    description: 'Find people, generate emails, send personalized outreach - all in one simple flow.',
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
