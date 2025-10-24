import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connexion — ZTVPlus',
  description: 'Connectez-vous à votre compte ZTVPlus pour accéder à tous nos films et séries en streaming.',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
