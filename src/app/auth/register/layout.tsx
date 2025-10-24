import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inscription — ZTVPlus',
  description: 'Créez votre compte ZTVPlus gratuitement et accédez à tous nos contenus en streaming.',
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
