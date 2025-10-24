import { Metadata } from 'next';
import MePage from './MePage';

export const metadata: Metadata = {
  title: 'Mon Espace — ZTVPlus',
  description: 'Gérez votre profil, votre watchlist, vos likes et votre historique de visionnage sur ZTVPlus.',
  keywords: 'profil, compte, watchlist, likes, historique, ZTVPlus',
  openGraph: {
    title: 'Mon Espace — ZTVPlus',
    description: 'Gérez votre profil et vos contenus préférés sur ZTVPlus.',
    type: 'website',
    siteName: 'ZTVPlus',
  },
  twitter: {
    card: 'summary',
    title: 'Mon Espace — ZTVPlus',
    description: 'Gérez votre profil et vos contenus préférés sur ZTVPlus.',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function Me() {
  return <MePage />;
}
