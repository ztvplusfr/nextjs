'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Analytics } from "@vercel/analytics/next";
import Header from '@/components/Header';

interface WatchlistItem {
  id: number;
  userId: number;
  contentId: number;
  contentType: 'MOVIE' | 'SERIES';
  createdAt: string;
  updatedAt: string;
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
  role: string;
}

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [contentData, setContentData] = useState<{[key: string]: MovieData | SeriesData}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'movies' | 'series'>('all');
  const router = useRouter();

  useEffect(() => {
    fetchUserData();
    fetchWatchlist();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des données utilisateur:', error);
      router.push('/auth/login');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    // Utiliser le timezone de l'utilisateur ou UTC par défaut
    const userTimezone = user?.timezone || 'Europe/Paris';

    try {
      return date.toLocaleDateString('fr-FR', {
        timeZone: userTimezone,
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      // Fallback en cas d'erreur de timezone
      console.warn('Erreur timezone, utilisation UTC:', error);
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);

    // Utiliser le timezone de l'utilisateur ou UTC par défaut
    const userTimezone = user?.timezone || 'Europe/Paris';

    try {
      return date.toLocaleTimeString('fr-FR', {
        timeZone: userTimezone,
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      // Fallback en cas d'erreur de timezone
      console.warn('Erreur timezone, utilisation UTC:', error);
      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const fetchWatchlist = async () => {
    try {
      const response = await fetch('/api/watchlist', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setWatchlist(data.data);
        
        // Récupérer les détails de chaque contenu
        await fetchContentDetails(data.data);
      } else {
        console.error('Erreur lors de la récupération de la watchlist');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de la watchlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchContentDetails = async (watchlistItems: WatchlistItem[]) => {
    const contentPromises = watchlistItems.map(async (item) => {
      try {
        const endpoint = item.contentType === 'MOVIE' ? '/api/movies' : '/api/series';
        const response = await fetch(`${endpoint}/${item.contentId}`, {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          return {
            key: `${item.contentId}-${item.contentType}`,
            data: data.data
          };
        }
      } catch (error) {
        console.error(`Erreur lors de la récupération du contenu ${item.contentId}:`, error);
      }
      return null;
    });

    const results = await Promise.all(contentPromises);
    const contentMap: {[key: string]: MovieData | SeriesData} = {};
    
    results.forEach(result => {
      if (result) {
        contentMap[result.key] = result.data;
      }
    });
    
    setContentData(contentMap);
  };

  const removeFromWatchlist = async (contentId: number, contentType: string) => {
    try {
      const response = await fetch(`/api/watchlist?contentId=${contentId}&contentType=${contentType}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (response.ok) {
        // Mettre à jour la liste locale
        setWatchlist(prev => prev.filter(item => 
          !(item.contentId === contentId && item.contentType === contentType)
        ));
        
        // Supprimer des données de contenu
        const key = `${contentId}-${contentType}`;
        setContentData(prev => {
          const newData = { ...prev };
          delete newData[key];
          return newData;
        });
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la watchlist:', error);
    }
  };

  const filteredWatchlist = watchlist.filter(item => {
    if (activeFilter === 'movies') return item.contentType === 'MOVIE';
    if (activeFilter === 'series') return item.contentType === 'SERIES';
    return true;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800 w-64 rounded mb-8"></div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-800 rounded-lg h-80"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grouper les éléments par date (jour complet)
  const groupedWatchlist = filteredWatchlist.reduce((groups, item) => {
    const date = new Date(item.createdAt);
    const userTimezone = user?.timezone || 'Europe/Paris';

    // Créer une clé de groupe basée sur la date (sans l'heure)
    const dateKey = date.toLocaleDateString('fr-FR', {
      timeZone: userTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(item);
    return groups;
  }, {} as {[key: string]: WatchlistItem[]});

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <i className="ti ti-bookmark text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Ma Watchlist
              </h1>
              <p className="text-gray-400 mt-1">
                Découvrez tous les films et séries que vous souhaitez regarder
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2 px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-300">{watchlist.length} contenu{watchlist.length > 1 ? 's' : ''} dans la liste</span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700">
              <i className="ti ti-filter text-blue-400"></i>
              <span className="text-gray-300">
                {activeFilter === 'all' ? 'Tous' : activeFilter === 'movies' ? 'Films' : 'Séries'}
              </span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-lg transition-all duration-300 ${
              activeFilter === 'all'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-600/50 hover:border-gray-500/50'
            }`}
          >
            <i className="ti ti-grid-dots mr-2"></i>
            Tous ({watchlist.length})
          </button>
          <button
            onClick={() => setActiveFilter('movies')}
            className={`px-4 py-2 rounded-lg transition-all duration-300 ${
              activeFilter === 'movies'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-600/50 hover:border-gray-500/50'
            }`}
          >
            <i className="ti ti-movie mr-2"></i>
            Films ({watchlist.filter(item => item.contentType === 'MOVIE').length})
          </button>
          <button
            onClick={() => setActiveFilter('series')}
            className={`px-4 py-2 rounded-lg transition-all duration-300 ${
              activeFilter === 'series'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-600/50 hover:border-gray-500/50'
            }`}
          >
            <i className="ti ti-device-tv mr-2"></i>
            Séries ({watchlist.filter(item => item.contentType === 'SERIES').length})
          </button>
        </div>

        {filteredWatchlist.length === 0 ? (
          <div className="text-center py-20">
            <div className="relative mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ti ti-bookmark text-4xl text-gray-500"></i>
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <i className="ti ti-plus text-white text-xs"></i>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-gray-300 mb-3">
              {activeFilter === 'all' ? 'Votre watchlist est vide' :
               activeFilter === 'movies' ? 'Aucun film dans votre watchlist' :
               'Aucune série dans votre watchlist'}
            </h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              {activeFilter === 'all' ? 'Commencez à ajouter des films et séries à votre liste pour les regarder plus tard !' :
               activeFilter === 'movies' ? 'Explorez nos films et ajoutez-les à votre liste.' :
               'Découvrez nos séries et ajoutez-les à votre liste.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <i className="ti ti-home mr-3 text-lg"></i>
                <span className="font-semibold">Découvrir du contenu</span>
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
          <div className="space-y-8">
            {Object.entries(groupedWatchlist)
              .sort(([a], [b]) => {
                // Trier par date (plus récente en premier)
                const dateA = new Date(a.split('/').reverse().join('-'));
                const dateB = new Date(b.split('/').reverse().join('-'));
                return dateB.getTime() - dateA.getTime();
              })
              .map(([dateKey, items]) => {
                // Convertir la clé de date en format d'affichage
                const displayDate = (() => {
                  const [day, month, year] = dateKey.split('/');
                  const date = new Date(`${year}-${month}-${day}`);
                  return formatDate(date.toISOString());
                })();
                return (
                <div key={dateKey} className="space-y-4">
                  <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-xl p-4 border border-gray-700/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                          <i className="ti ti-calendar text-blue-400 text-lg"></i>
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-white capitalize">
                            {displayDate}
                          </h2>
                          <p className="text-sm text-gray-400 mt-1">
                            {items.length} contenu{items.length > 1 ? 's' : ''} ajouté{items.length > 1 ? 's' : ''} ce jour
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 uppercase tracking-wide">
                          {items.length} élément{items.length > 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                    {items.map((item) => {
                      const content = contentData[`${item.contentId}-${item.contentType}`];
                      if (!content) return null;

                      return (
                        <div key={`${item.contentId}-${item.contentType}`} className="group relative">
                          <Link
                            href={item.contentType === 'MOVIE' ? `/movies/${item.contentId}` : `/series/${item.contentId}`}
                            className="block"
                          >
                            <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 shadow-lg group-hover:shadow-xl transition-all duration-300">
                              {content.poster ? (
                                <Image
                                  src={content.poster.startsWith('http')
                                    ? content.poster
                                    : `https://image.tmdb.org/t/p/w500${content.poster}`
                                  }
                                  alt={content.title}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16.67vw"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/placeholder-movie.jpg';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                  <i className="ti ti-movie text-4xl text-gray-600"></i>
                                </div>
                              )}

                              {/* Overlay */}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"></div>

                              {/* Content Type Badge */}
                              <div className="absolute top-3 left-3">
                                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
                                  item.contentType === 'MOVIE'
                                    ? 'bg-gradient-to-r from-blue-500/90 to-blue-600/90 text-white border border-blue-400/50'
                                    : 'bg-gradient-to-r from-purple-500/90 to-purple-600/90 text-white border border-purple-400/50'
                                }`}>
                                  <i className={`ti mr-1.5 text-sm ${
                                    item.contentType === 'MOVIE' ? 'ti-movie' : 'ti-device-tv'
                                  }`}></i>
                                  {item.contentType === 'MOVIE' ? 'Film' : 'Série'}
                                </span>
                              </div>

                              {/* Remove Button */}
                              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    removeFromWatchlist(item.contentId, item.contentType);
                                  }}
                                  className="w-8 h-8 bg-red-500/90 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110"
                                >
                                  <i className="ti ti-x text-white text-sm"></i>
                                </button>
                              </div>

                              {/* Rating Badge */}
                              {content.rating && (
                                <div className="absolute bottom-3 left-3">
                                  <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-yellow-500/90 text-black border border-yellow-400/50">
                                    <i className="ti ti-star mr-1 text-xs"></i>
                                    {content.rating.toFixed(1)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </Link>

                          {/* Content Info */}
                          <div className="mt-3 px-1">
                            <h3 className="font-semibold text-white text-sm line-clamp-2 mb-2 group-hover:text-blue-400 transition-colors">
                              {content.title}
                            </h3>
                            <div className="space-y-2">
                              <div className="flex items-center text-xs text-gray-400">
                              <i className="ti ti-calendar mr-1 text-xs"></i>
                              {content.year}
                              </div>
                              <div className="flex items-center text-xs text-gray-500">
                              <i className="ti ti-clock mr-1 text-xs"></i>
                              Ajouté à {formatTime(item.createdAt)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Analytics />
    </div>
  );
}
