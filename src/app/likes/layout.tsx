import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mes Likes — ZTVPlus',
  description: 'Découvrez tous les films et séries que vous avez likés sur ZTVPlus.',
};

export default function LikesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

