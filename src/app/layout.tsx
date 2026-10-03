import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';

export const metadata: Metadata = {
  title: 'FinHealth AI - Smart Business Financial Assistant for Indian SMBs',
  description: 'AI-powered financial operating system and intelligent copilot for small and medium businesses',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="bg-[#F8FAFC] text-slate-900 antialiased font-sans min-h-screen selection:bg-indigo-100 selection:text-indigo-900">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}