import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import "@/styles/artplayer.css";
import PageLoader from "@/components/PageLoader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ZTVPlus - Votre plateforme de streaming",
    template: "%s"
  },
  description: "Découvrez ZTVPlus, votre plateforme de streaming préférée. Films, séries, épisodes en haute qualité. Rejoignez notre communauté Discord pour discuter et partager vos avis.",
  keywords: ["streaming", "films", "séries", "ZTVPlus", "plateforme", "vidéo", "entertainment"],
  authors: [{ name: "ZTVPlus Team" }],
  creator: "ZTVPlus",
  publisher: "ZTVPlus",
  icons: {
    icon: [
      { url: '/brand/favicon.ico', sizes: 'any' },
      { url: '/brand/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/brand/favicon.png', sizes: '16x16', type: 'image/png' }
    ],
    apple: '/brand/favicon.png',
    shortcut: '/brand/favicon.ico'
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://ztvplus.fr'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://ztvplus.fr',
    title: 'ZTVPlus - Votre plateforme de streaming',
    description: 'Découvrez ZTVPlus, votre plateforme de streaming préférée. Films, séries, épisodes en haute qualité.',
    siteName: 'ZTVPlus',
    images: [
      {
        url: 'https://res.cloudinary.com/dp98soedn/image/upload/v1761251325/logo_ajahwp.png',
        width: 1200,
        height: 630,
        alt: 'ZTVPlus Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZTVPlus - Votre plateforme de streaming',
    description: 'Découvrez ZTVPlus, votre plateforme de streaming préférée. Films, séries, épisodes en haute qualité.',
    images: ['https://res.cloudinary.com/dp98soedn/image/upload/v1761251325/logo_ajahwp.png'],
  },
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
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css" />
        <link rel="icon" href="/brand/favicon.ico" sizes="any" />
        <link rel="icon" href="/brand/favicon.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/brand/favicon.png" type="image/png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/brand/favicon.png" />
        <link rel="shortcut icon" href="/brand/favicon.ico" />
        <link rel="manifest" href="/brand/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PageLoader>
          {children}
        </PageLoader>
        <Analytics />
      </body>
    </html>
  );
}
