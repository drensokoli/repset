import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/components/auth-provider';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'RepSet - Your Ultimate Workout Companion',
    template: '%s | RepSet'
  },
  description: 'RepSet is your ultimate workout companion for planning, tracking, and achieving your fitness goals. Access a comprehensive exercise database, create custom workout plans, and track your progress with our powerful fitness app.',
  keywords: [
    'workout planner',
    'fitness tracker',
    'exercise database',
    'gym workout',
    'strength training',
    'fitness app',
    'workout routine',
    'exercise planner',
    'fitness goals',
    'muscle building',
    'weight training',
    'bodybuilding',
    'fitness tracking',
    'workout log',
    'exercise library'
  ],
  authors: [{ name: 'RepSet Team' }],
  creator: 'RepSet',
  publisher: 'RepSet',
  applicationName: 'RepSet',
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1d4ed8' }
  ],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL || 'https://repset.app',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://repset.app',
    siteName: 'RepSet',
    title: 'RepSet - Your Ultimate Workout Companion',
    description: 'Plan, track, and achieve your fitness goals with RepSet. Access a comprehensive exercise database and create custom workout routines.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'RepSet - Workout Planner & Fitness Tracker',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@repsetapp',
    creator: '@repsetapp',
    title: 'RepSet - Your Ultimate Workout Companion',
    description: 'Plan, track, and achieve your fitness goals with RepSet. Access a comprehensive exercise database and create custom workout routines.',
    images: ['/twitter-image.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'RepSet',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="RepSet" />
        <meta name="apple-mobile-web-app-title" content="RepSet" />
        <meta name="msapplication-starturl" content="/" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "RepSet",
              "description": "Your ultimate workout companion for planning, tracking, and achieving your fitness goals",
              "url": process.env.NEXT_PUBLIC_APP_URL || "https://repset.app",
              "applicationCategory": "HealthApplication",
              "operatingSystem": "Any",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "author": {
                "@type": "Organization",
                "name": "RepSet Team"
              },
              "publisher": {
                "@type": "Organization",
                "name": "RepSet"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "ratingCount": "1000"
              },
              "featureList": [
                "Comprehensive Exercise Database",
                "Custom Workout Planning",
                "Progress Tracking",
                "Weekly Workout Calendar",
                "Exercise Form Guidance",
                "Offline Access"
              ]
            })
          }}
        />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}