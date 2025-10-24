'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Analytics } from "@vercel/analytics/next";
import Header from '@/components/Header';

interface LikeItem {
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
  role: string;
}

export default function LikesPage() {
  const [likes, setLikes] = useState<LikeItem[]>([]);
  const [contentData, setContentData] = useState<{[key: string]: MovieData | SeriesData}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'movies' | 'series'>('all');
  const router = useRouter();

  useEffect(() => {
    fetchUserData();
    fetchLikes();
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

  const fetchLikes = async () => {
    try {
      const response = await fetch('/api/likes', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setLikes(data.data);
        
        // Récupérer les détails de chaque contenu
        await fetchContentDetails(data.data);
      } else {
        console.error('Erreur lors de la récupération des likes');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des likes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchContentDetails = async (likeItems: LikeItem[]) => {
    const contentPromises = likeItems.map(async (item) => {
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

  const removeLike = async (contentId: number, contentType: string) => {
    try {
      const response = await fetch(`/api/likes?contentId=${contentId}&contentType=${contentType}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (response.ok) {
        // Mettre à jour la liste locale
        setLikes(prev => prev.filter(item => 
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
      console.error('Erreur lors de la suppression du like:', error);
    }
  };

  const filteredLikes = likes.filter(item => {
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

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Mes Likes</h1>
          <p className="text-gray-400">
            {filteredLikes.length} élément{filteredLikes.length > 1 ? 's' : ''} liké{filteredLikes.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Filters */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeFilter === 'all'
                ? 'bg-red-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Tous ({likes.length})
          </button>
          <button
            onClick={() => setActiveFilter('movies')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeFilter === 'movies'
                ? 'bg-red-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Films ({likes.filter(item => item.contentType === 'MOVIE').length})
          </button>
          <button
            onClick={() => setActiveFilter('series')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeFilter === 'series'
                ? 'bg-red-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Séries ({likes.filter(item => item.contentType === 'SERIES').length})
          </button>
        </div>

        {/* Content Grid */}
        {filteredLikes.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">❤️</div>
            <h3 className="text-2xl font-semibold text-white mb-2">
              {activeFilter === 'all' ? 'Aucun contenu liké' : 
               activeFilter === 'movies' ? 'Aucun film liké' : 
               'Aucune série likée'}
            </h3>
            <p className="text-gray-400 mb-6">
              {activeFilter === 'all' ? 'Commencez à liker des films et séries !' :
               activeFilter === 'movies' ? 'Explorez nos films et likez ceux qui vous plaisent.' :
               'Découvrez nos séries et likez celles qui vous plaisent.'}
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <i className="ti ti-heart mr-2"></i>
              Découvrir du contenu
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredLikes.map((item) => {
              const content = contentData[`${item.contentId}-${item.contentType}`];
              if (!content) return null;

              return (
                <div key={`${item.contentId}-${item.contentType}`} className="group relative">
                  <Link
                    href={item.contentType === 'MOVIE' ? `/movies/${item.contentId}` : `/series/${item.contentId}`}
                    className="block"
                  >
                    <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
                      {content.poster ? (
                        <Image
                          src={content.poster.startsWith('http') 
                            ? content.poster 
                            : `https://image.tmdb.org/t/p/w500${content.poster}`
                          }
                          alt={content.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
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
                      <div className="absolute top-2 left-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          item.contentType === 'MOVIE' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-purple-600 text-white'
                        }`}>
                          {item.contentType === 'MOVIE' ? 'Film' : 'Série'}
                        </span>
                      </div>

                      {/* Like Badge */}
                      <div className="absolute top-2 right-2">
                        <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold">
                          ❤️ Liké
                        </span>
                      </div>

                      {/* Rating */}
                      {content.rating && (
                        <div className="absolute top-2 left-2 mt-8">
                          <span className="bg-black/70 text-white px-2 py-1 rounded text-xs font-semibold">
                            ⭐ {Math.round(content.rating * 10) / 10}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Content Info */}
                  <div className="mt-3">
                    <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2 group-hover:text-red-400 transition-colors">
                      {content.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{content.year}</span>
                      {item.contentType === 'SERIES' && (content as SeriesData).numberOfSeasons && (
                        <span>{(content as SeriesData).numberOfSeasons} saison{(content as SeriesData).numberOfSeasons! > 1 ? 's' : ''}</span>
                      )}
                      {item.contentType === 'MOVIE' && (content as MovieData).duration && (
                        <span>{Math.floor((content as MovieData).duration! / 60)}h {(content as MovieData).duration! % 60}min</span>
                      )}
                    </div>
                  </div>

                  {/* Remove Like Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeLike(item.contentId, item.contentType);
                    }}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-black/70 hover:bg-red-600 text-white p-2 rounded-full transition-all duration-200 w-8 h-8 flex items-center justify-center"
                    title="Retirer le like"
                  >
                    <i className="ti ti-heart-off text-sm"></i>
                  </button>
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

