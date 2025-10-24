'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';

interface VideoDetails {
  id: number;
  title: string;
  quality: string | null;
  language: string | null;
  type: string;
}

interface HistoryItem {
  id: number;
  userId: number;
  contentId: number;
  contentType: 'MOVIE' | 'SERIES';
  videoId: number | null;
  watchedAt: string;
  navigationUrl: string;
  video: VideoDetails | null;
}

interface MovieData {
  id: number;
  title: string;
  originalTitle?: string;
  year?: number;
  rating?: number;
  poster?: string;
  backdrop?: string;
  description?: string;
  duration?: number;
  genres?: string[];
}

interface SeriesData {
  id: number;
  title: string;
  originalTitle?: string;
  year?: number;
  rating?: number;
  poster?: string;
  backdrop?: string;
  description?: string;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  genres?: string[];
}

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  avatar: string | null;
  timezone: string | null;
}

export default function HistoryPage() {
  const router = useRouter();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [movieData, setMovieData] = useState<{ [key: number]: MovieData }>({});
  const [seriesData, setSeriesData] = useState<{ [key: number]: SeriesData }>({});
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Vérification de l'authentification
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        if (!response.ok) {
          router.push('/auth/login');
          return;
        }

        const data = await response.json();
        setUser(data.user);
        setAuthLoading(false);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/auth/login');
      }
    };

    checkAuth();
  }, [router]);

  // Chargement de l'historique
  useEffect(() => {
    if (authLoading) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          limit: '20',
          offset: ((page - 1) * 20).toString()
        });

        const response = await fetch(`/api/history?${params}`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setHistoryItems(data.data);
          setTotal(data.pagination.total);
          setHasMore(data.pagination.hasMore);

          // Récupérer les données des films et séries
          await fetchContentData(data.data);
        }
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [authLoading, page]);

  const fetchContentData = async (items: HistoryItem[]) => {
    const movieIds = items.filter(item => item.contentType === 'MOVIE').map(item => item.contentId);
    const seriesIds = items.filter(item => item.contentType === 'SERIES').map(item => item.contentId);

    // Récupérer les données des films
    if (movieIds.length > 0) {
      try {
        const moviePromises = movieIds.map(id =>
          fetch(`/api/movies/${id}`).then(res => res.ok ? res.json() : null)
        );
        const movieResults = await Promise.all(moviePromises);
        const movieMap: { [key: number]: MovieData } = {};

        movieResults.forEach((result, index) => {
          if (result && result.success && result.data) {
            movieMap[movieIds[index]] = result.data;
          }
        });

        setMovieData(prev => ({ ...prev, ...movieMap }));
      } catch (error) {
        console.error('Error fetching movies:', error);
      }
    }

    // Récupérer les données des séries
    if (seriesIds.length > 0) {
      try {
        const seriesPromises = seriesIds.map(id =>
          fetch(`/api/series/${id}`).then(res => res.ok ? res.json() : null)
        );
        const seriesResults = await Promise.all(seriesPromises);
        const seriesMap: { [key: number]: SeriesData } = {};

        seriesResults.forEach((result, index) => {
          if (result && result.success && result.data) {
            seriesMap[seriesIds[index]] = result.data;
          }
        });

        setSeriesData(prev => ({ ...prev, ...seriesMap }));
      } catch (error) {
        console.error('Error fetching series:', error);
      }
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  };

  const getContentData = (item: HistoryItem) => {
    if (item.contentType === 'MOVIE') {
      return movieData[item.contentId];
    } else {
      return seriesData[item.contentId];
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    // Utiliser le timezone de l'utilisateur ou UTC par défaut
    const userTimezone = user?.timezone || 'Europe/Paris';

    try {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: userTimezone
      });
    } catch (error) {
      // Fallback en cas d'erreur de timezone
      console.warn('Erreur timezone, utilisation UTC:', error);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  if (authLoading) {
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
    <div className="min-h-screen bg-black text-white">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <i className="ti ti-history text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Historique de visionnage
              </h1>
              <p className="text-gray-400 mt-1">
                Retrouvez tous les contenus que vous avez regardés récemment
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2 px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-300">{historyItems.length} contenu{historyItems.length > 1 ? 's' : ''} vu{historyItems.length > 1 ? 's' : ''}</span>
            </div>
            {historyItems.length > 0 && (
              <div className="flex items-center space-x-2 px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700">
                <i className="ti ti-clock text-blue-400"></i>
                <span className="text-gray-300">
                  Dernière activité: {formatDate(historyItems[0].watchedAt)}
                </span>
              </div>
            )}
          </div>
        </div>

        {loading && historyItems.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : historyItems.length === 0 ? (
          <div className="text-center py-20">
            <div className="relative mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ti ti-history text-4xl text-gray-500"></i>
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <i className="ti ti-eye text-white text-xs"></i>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-gray-300 mb-3">Aucun historique</h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Vous n'avez encore regardé aucun contenu. Commencez votre aventure cinématographique !
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <i className="ti ti-home mr-3 text-lg"></i>
                <span className="font-semibold">Découvrir des contenus</span>
              </Link>

              <Link
                href="/movies"
                className="inline-flex items-center px-8 py-4 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-xl transition-all duration-300"
              >
                <i className="ti ti-movie mr-3 text-lg"></i>
                <span>Explorer les films</span>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {historyItems.map((item) => {
                const contentData = getContentData(item);
                if (!contentData) return null;

                return (
                  <div
                    key={`${item.id}-${item.videoId}`}
                    className="bg-gray-900 rounded-lg overflow-hidden hover:bg-gray-800 transition-colors group cursor-pointer"
                    onClick={() => {
                      router.push(item.navigationUrl);
                    }}
                  >
                    <div className="aspect-[2/3] relative overflow-hidden">
                      <Image
                        src={contentData.poster || '/placeholder-poster.jpg'}
                        alt={contentData.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      <div className="absolute top-2 right-2">
                        <span className="bg-black/70 text-white text-xs px-2 py-1 rounded">
                          {item.contentType === 'MOVIE' ? 'Film' : 'Série'}
                        </span>
                      </div>
                    </div>

                    <div className="p-4">
                      {/* Titre et badges principaux */}
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="font-semibold text-lg line-clamp-2 flex-1 mr-3">
                          {contentData.title}
                        </h3>
                        <div className="flex flex-col items-end space-y-2 flex-shrink-0">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
                            item.contentType === 'MOVIE'
                              ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-300 border border-blue-500/40'
                              : 'bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-300 border border-purple-500/40'
                          }`}>
                            <i className={`ti mr-1.5 text-sm ${
                              item.contentType === 'MOVIE' ? 'ti-movie' : 'ti-device-tv'
                            }`}></i>
                            {item.contentType === 'MOVIE' ? 'Film' : 'Série'}
                          </span>
                          {item.video?.language && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-500/20 text-orange-300 border border-orange-500/30">
                              <i className="ti ti-language mr-1 text-xs"></i>
                              {item.video.language.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Badges d'information */}
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        {contentData.year && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-green-500/15 text-green-300 border border-green-500/25">
                            <i className="ti ti-calendar mr-1.5 text-xs"></i>
                            {contentData.year}
                          </span>
                        )}
                        {contentData.rating && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-yellow-500/15 text-yellow-300 border border-yellow-500/25">
                            <i className="ti ti-star mr-1.5 text-xs"></i>
                            {contentData.rating.toFixed(1)}
                          </span>
                        )}
                        {item.video?.quality && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-cyan-500/15 text-cyan-300 border border-cyan-500/25">
                            <i className="ti ti-video mr-1.5 text-xs"></i>
                            {item.video.quality}
                          </span>
                        )}
                        {item.video?.type && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-pink-500/15 text-pink-300 border border-pink-500/25">
                            <i className="ti ti-tag mr-1.5 text-xs"></i>
                            {item.video.type}
                          </span>
                        )}
                      </div>

                      {/* Informations de visionnage */}
                      <div className="border-t border-gray-700/50 pt-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-xs text-gray-400">
                            <i className="ti ti-clock mr-1.5"></i>
                            <span>Vu le {formatDate(item.watchedAt)}</span>
                          </div>
                          <div className="flex items-center text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                            <i className="ti ti-eye mr-1.5"></i>
                            Regardé
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {hasMore && (
              <div className="text-center pt-8">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-8 py-4 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-600 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:transform-none disabled:shadow-none"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent mr-3"></div>
                      <span className="font-medium">Chargement en cours...</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <i className="ti ti-chevron-down mr-3 text-lg"></i>
                      <span className="font-medium">Charger plus de contenus</span>
                    </div>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
