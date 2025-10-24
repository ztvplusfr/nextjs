import { Metadata } from 'next';
import HomeClient from './HomeClient';

export const metadata: Metadata = {
  title: 'Accueil - ZTVPlus',
  description: 'Découvrez ZTV+, votre plateforme de streaming ultime pour films, séries et animes. Regardez en direct et à la demande avec une qualité exceptionnelle.',
  keywords: 'streaming, films, séries, animes, ZTV+, streaming gratuit, films en ligne, séries en ligne',
  openGraph: {
    title: 'ZTV+ - Streaming Films, Séries et Animes',
    description: 'Découvrez ZTV+, votre plateforme de streaming ultime pour films, séries et animes.',
    type: 'website',
    siteName: 'ZTV+',
    images: [
      {
        url: 'https://res.cloudinary.com/dp98soedn/image/upload/v1761251325/logo_ajahwp.png',
        width: 1200,
        height: 630,
        alt: 'ZTV+ Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZTV+ - Streaming Films, Séries et Animes',
    description: 'Découvrez ZTV+, votre plateforme de streaming ultime pour films, séries et animes.',
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
};

export default function Home() {
  return <HomeClient />;
}
