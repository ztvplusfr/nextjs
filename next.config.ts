import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuration ESLint - Ignorer les erreurs pendant le build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Configuration des images pour TMDB
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        port: '',
        pathname: '/t/p/**',
      },
    ],
  },
  // Configuration pour le build
  outputFileTracingRoot: process.cwd(),
  // Configuration pour les origines de développement autorisées
  allowedDevOrigins: [
    '192.168.1.3', // Adresse IP locale détectée
    'localhost',
    '127.0.0.1',
  ],
  // Configuration Turbopack
  turbopack: {
    // Configuration Turbopack pour de meilleures performances
    rules: {
      // Optimisation pour les images
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
};

export default nextConfig;
