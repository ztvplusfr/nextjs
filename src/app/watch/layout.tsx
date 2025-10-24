import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lecture — ZTVPlus',
  description: 'Regardez vos films et séries préférés en streaming haute qualité sur ZTVPlus.',
};

export default function WatchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
