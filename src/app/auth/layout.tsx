import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentification — ZTVPlus',
  description: 'Connectez-vous ou créez votre compte ZTVPlus pour accéder à tous nos contenus en streaming.',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
