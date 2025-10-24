import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Films — ZTVPlus',
  description: 'Découvrez tous nos films sur ZTVPlus. Derniers films, top 10, et bien plus encore. Votre plateforme de streaming préférée.',
};

export default function MoviesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
