import { Metadata } from 'next';
import SettingsPage from './SettingsPage';

export const metadata: Metadata = {
  title: 'Paramètres — ZTVPlus',
  description: 'Gérez vos paramètres et préférences sur ZTVPlus. Personnalisez votre fuseau horaire et vos préférences de compte.',
  keywords: 'paramètres, préférences, fuseau horaire, compte, ZTVPlus',
  openGraph: {
    title: 'Paramètres — ZTVPlus',
    description: 'Gérez vos paramètres et préférences sur ZTVPlus.',
    type: 'website',
    siteName: 'ZTVPlus',
  },
  twitter: {
    card: 'summary',
    title: 'Paramètres — ZTVPlus',
    description: 'Gérez vos paramètres et préférences sur ZTVPlus.',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function Settings() {
  return <SettingsPage />;
}
