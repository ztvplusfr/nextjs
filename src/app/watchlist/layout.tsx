import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ma Liste — ZTVPlus',
  description: 'Consultez votre liste de films et séries à regarder sur ZTVPlus. Gérez vos favoris et découvrez de nouveaux contenus.',
};

export default function WatchlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
