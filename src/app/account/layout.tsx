import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mon Compte — ZTVPlus',
  description: 'Gérez votre compte ZTVPlus. Modifiez vos informations, gérer vos sessions, et paramètres de sécurité.',
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
