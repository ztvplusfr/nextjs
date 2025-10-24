'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Analytics } from "@vercel/analytics/next";
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSlider from '@/components/HeroSlider';
import LatestMoviesCarousel from '@/components/LatestMoviesCarousel';
import LatestSeriesCarousel from '@/components/LatestSeriesCarousel';
import LatestEpisodesCarousel from '@/components/LatestEpisodesCarousel';
import Top10Movies from '@/components/Top10Movies';
import Top10Series from '@/components/Top10Series';
import DiscordCard from '@/components/DiscordCard';

export default function HomeClient() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Vérification de l'authentification
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        if (!response.ok) {
          // Utilisateur non connecté, redirection vers la page de connexion
          router.push('/auth/login');
          return;
        }

        // Utilisateur connecté, on peut continuer
        setIsLoading(false);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/auth/login');
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />

      {/* Hero Slider */}
      <HeroSlider />

      {/* Latest Movies Carousel */}
      <section className="py-8 px-0 md:px-6">
        <div className="w-full">
          <div className="flex items-center justify-between mb-6 ml-4 md:ml-16 mr-4 md:mr-16">
            <h2 className="text-xl md:text-2xl font-bold text-white">Derniers films</h2>
            <Link
              href="/movies"
              className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors flex items-center"
            >
              Voir tous
              <i className="ti ti-chevron-right ml-1"></i>
            </Link>
          </div>
          <div className="ml-0 md:ml-16">
            <LatestMoviesCarousel />
          </div>
        </div>
      </section>

      {/* Discord Card */}
      <DiscordCard />

      {/* Latest Episodes Carousel */}
      <section className="py-8 px-0 md:px-6">
        <div className="w-full">
          <div className="flex items-center justify-between mb-6 ml-4 md:ml-16 mr-4 md:mr-16">
            <h2 className="text-xl md:text-2xl font-bold text-white">Derniers épisodes</h2>
            <Link
              href="/series"
              className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors flex items-center"
            >
              Voir toutes les séries
              <i className="ti ti-chevron-right ml-1"></i>
            </Link>
          </div>
          <div className="ml-0 md:ml-16">
            <LatestEpisodesCarousel />
          </div>
        </div>
      </section>

      {/* Latest Series Carousel */}
      <section className="py-8 px-0 md:px-6">
        <div className="w-full">
          <div className="flex items-center justify-between mb-6 ml-4 md:ml-16 mr-4 md:mr-16">
            <h2 className="text-xl md:text-2xl font-bold text-white">Dernières séries</h2>
            <Link
              href="/series"
              className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors flex items-center"
            >
              Voir tous
              <i className="ti ti-chevron-right ml-1"></i>
            </Link>
          </div>
          <div className="ml-0 md:ml-16">
            <LatestSeriesCarousel />
          </div>
        </div>
      </section>

      {/* Top 10 Movies Carousel */}
      <section className="py-8 px-0 md:px-6">
        <div className="w-full">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-6 ml-4 md:ml-16">Top 10 des Films sur ZTVPlus</h2>
          <div className="ml-0 md:ml-16">
            <Top10Movies />
          </div>
        </div>
      </section>

      {/* Top 10 Series Carousel */}
      <section className="py-8 px-0 md:px-6">
        <div className="w-full">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-6 ml-4 md:ml-16">Top 10 des Séries sur ZTVPlus</h2>
          <div className="ml-0 md:ml-16">
            <Top10Series />
          </div>
        </div>
      </section>

      <Footer />
      <Analytics />
    </div>
  );
}
