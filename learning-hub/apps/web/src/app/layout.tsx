import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';

import './globals.css';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';

// Fonts are loaded from a Google Fonts <link> in the head below.
// Using next/font/google requires network access to fonts.googleapis.com at
// build/render time, which is not available in every environment (e.g. this
// sandbox). The browser-side <link> falls back gracefully to system fonts.

export const metadata: Metadata = {
  title: {
    default: 'Lumen — Premium online classes from the people who shape the work',
    template: '%s · Lumen',
  },
  description:
    'Cinematic online classes taught by Grammy winners, award-winning filmmakers, Michelin chefs, and Pulitzer authors. Watch on the web and on every TV.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#E8B14F',
          colorBackground: '#0A0A0B',
          colorInputBackground: '#1c1c1f',
          colorText: '#F5F5F4',
        },
      }}
    >
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          {/* eslint-disable-next-line @next/next/no-page-custom-font */}
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap"
            rel="stylesheet"
          />
        </head>
        <body className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-fg-primary)] antialiased">
          <SiteHeader />
          <main className="pt-16">{children}</main>
          <SiteFooter />
        </body>
      </html>
    </ClerkProvider>
  );
}
