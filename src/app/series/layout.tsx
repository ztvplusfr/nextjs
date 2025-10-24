import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Séries — ZTVPlus',
  description: 'Découvrez toutes nos séries sur ZTVPlus. Dernières séries, top 10, et bien plus encore. Votre plateforme de streaming préférée.',
};

export default function SeriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
