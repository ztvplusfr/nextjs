import { Metadata } from 'next';
import HistoryPage from './HistoryPage';

export const metadata: Metadata = {
  title: 'Historique — ZTVPlus',
  description: 'Consultez votre historique de visionnage sur ZTVPlus. Retrouvez tous les films et séries que vous avez regardés récemment.',
  keywords: 'historique, visionnage, films vus, séries vues, ZTVPlus',
  openGraph: {
    title: 'Historique — ZTVPlus',
    description: 'Consultez votre historique de visionnage sur ZTVPlus.',
    type: 'website',
    siteName: 'ZTVPlus',
  },
  twitter: {
    card: 'summary',
    title: 'Historique — ZTVPlus',
    description: 'Consultez votre historique de visionnage sur ZTVPlus.',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function History() {
  return <HistoryPage />;
}
