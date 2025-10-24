'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Notification from './Notification';

interface Movie {
  id: number;
  title: string;
  originalTitle?: string;
  description?: string;
  year?: number;
  rating?: number;
  duration?: number;
  poster?: string;
  backdrop?: string;
  releaseDate?: string;
  genres: string[];
  videos?: Array<{
    id: number;
    title: string;
    embedUrl: string;
    quality?: string;
    language: string;
    type: string;
  }>;
}

interface MovieCardProps {
  movie: Movie;
}

export default function MovieCard({ movie }: MovieCardProps) {
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isWatchlistLoading, setIsWatchlistLoading] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    isVisible: boolean;
  }>({
    message: '',
    type: 'info',
    isVisible: false
  });

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({
      message,
      type,
      isVisible: true
    });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };

  // Vérifier le statut de la watchlist au chargement
  useEffect(() => {
    const checkWatchlistStatus = async () => {
      try {
        const response = await fetch(`/api/watchlist/check?contentId=${movie.id}&contentType=MOVIE`, {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsInWatchlist(data.data.isInWatchlist);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de la watchlist:', error);
      }
    };

    checkWatchlistStatus();
  }, [movie.id]);

  const toggleWatchlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isWatchlistLoading) return;
    
    setIsWatchlistLoading(true);
    try {
      if (isInWatchlist) {
        // Supprimer de la watchlist
        const response = await fetch(`/api/watchlist?contentId=${movie.id}&contentType=MOVIE`, {
          method: 'DELETE',
          credentials: 'include',
        });
        
        if (response.ok) {
          setIsInWatchlist(false);
          showNotification('Film supprimé de votre watchlist', 'success');
        } else {
          showNotification('Erreur lors de la suppression', 'error');
        }
      } else {
        // Ajouter à la watchlist
        const response = await fetch('/api/watchlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            contentId: movie.id,
            contentType: 'MOVIE'
          })
        });
        
        if (response.ok) {
          setIsInWatchlist(true);
          showNotification('Film ajouté à votre watchlist', 'success');
        } else {
          showNotification('Erreur lors de l\'ajout', 'error');
        }
      }
    } catch (error) {
      console.error('Erreur lors de la modification de la watchlist:', error);
      showNotification('Erreur de connexion', 'error');
    } finally {
      setIsWatchlistLoading(false);
    }
  };

  const getPosterUrl = () => {
    if (!movie.poster) return '/placeholder-movie.jpg';
    if (movie.poster.startsWith('http')) return movie.poster;
    return `https://image.tmdb.org/t/p/w500${movie.poster}`;
  };

  const getYear = () => {
    if (movie.year) return movie.year;
    if (movie.releaseDate) return new Date(movie.releaseDate).getFullYear();
    return null;
  };

  const currentYear = new Date().getFullYear();

  const hasAvailableVideos = () => {
    return movie?.videos && movie.videos.length > 0;
  };

  return (
    <>
      <div className="group block">
        <div className="relative bg-black rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:z-10">
          {/* Poster - Portrait parfait */}
          <div className="relative aspect-[2/3] w-full overflow-hidden">
            <Image
              src={getPosterUrl()}
              alt={movie.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
            
            {/* Gradient overlay pour le texte */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Overlay avec boutons - Style Netflix */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 opacity-0 group-hover:opacity-100">
              {/* Bouton Play au centre */}
              <div className="absolute inset-0 flex items-center justify-center">
                <button className="bg-sky-500 hover:bg-sky-400 text-white w-16 h-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110 flex items-center justify-center">
                  <i className="ti ti-player-play text-2xl"></i>
                </button>
              </div>
              
              {/* Boutons en bas à droite */}
              <div className="absolute bottom-4 right-4 flex space-x-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                <button 
                  onClick={toggleWatchlist}
                  disabled={isWatchlistLoading}
                  className={`w-10 h-10 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110 flex items-center justify-center ${
                    isInWatchlist
                      ? 'bg-sky-500 hover:bg-sky-400 text-white'
                      : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
                  } ${isWatchlistLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <i className={`ti ${isInWatchlist ? 'ti-bookmark-filled' : 'ti-bookmark'} text-sm`}></i>
                </button>
                <Link href={`/movies/${movie.id}`}>
                  <button className="bg-white/20 backdrop-blur-sm text-white w-10 h-10 rounded-full hover:bg-white/30 transition-all duration-200 transform hover:scale-110 flex items-center justify-center">
                    <i className="ti ti-info-circle text-sm"></i>
                  </button>
                </Link>
              </div>
            </div>

            {/* Badge "Nouveau" en haut à gauche */}
            {getYear() && getYear()! >= currentYear - 1 && (
              <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold shadow-lg">
                NOUVEAU
              </div>
            )}

            {/* Menu mobile - Bouton dots en haut à droite */}
            <div className="absolute top-3 right-3 md:hidden">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowMobileMenu(!showMobileMenu);
                }}
                className="bg-black/70 hover:bg-black/90 text-white w-8 h-8 rounded-full transition-all duration-200 backdrop-blur-sm flex items-center justify-center"
              >
                <i className="ti ti-dots-circle-horizontal text-sm"></i>
              </button>
            </div>
          </div>

          {/* Informations - Style Netflix */}
          <div className="p-4 bg-black">
            <h3 className="text-white font-bold text-lg mb-2 line-clamp-2 group-hover:text-sky-400 transition-colors duration-300">
              {movie.title}
            </h3>
            
            <div className="flex items-center justify-between text-sm text-gray-300 mb-3">
              <span className="font-medium">{getYear()}</span>
              <div className="flex flex-col items-end">
                {movie.rating && (
                  <div className="flex items-center mb-1">
                    <i className="ti ti-star-filled text-sky-400 mr-1 text-xs"></i>
                    <span className="text-sky-400 font-bold text-xs">
                      {Math.round(movie.rating * 10) / 10}
                    </span>
                  </div>
                )}
                {movie.duration && (
                  <span className="text-gray-400 text-xs">
                    {Math.floor(movie.duration / 60)}h {movie.duration % 60}min
                  </span>
                )}
              </div>
            </div>

            {/* Genres - Style amélioré */}
            <div className="flex flex-wrap gap-1">
              {movie.genres.slice(0, 2).map((genre, index) => (
                <span 
                  key={index}
                  className="text-xs bg-sky-500/20 text-sky-300 px-2 py-1 rounded-full border border-sky-500/30"
                >
                  {genre}
                </span>
              ))}
              {movie.genres.length > 2 && (
                <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">
                  +{movie.genres.length - 2}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Menu mobile dropdown */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setShowMobileMenu(false)}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
          <div className="absolute bottom-0 left-0 right-0 bg-black/95 backdrop-blur-lg border-t border-gray-600/50 shadow-2xl py-4 px-4 rounded-t-2xl">
            <div className="space-y-0">
              {/* Lire le film */}
              {hasAvailableVideos() && (
                <>
                  <Link href={`/watch/movie/${movie.id}/${movie.videos![0].id}`}>
                    <button 
                      onClick={() => setShowMobileMenu(false)}
                      className="w-full px-4 py-3 text-left text-white hover:bg-gray-700/50 transition-colors flex items-center"
                    >
                      <i className="ti ti-player-play text-xl mr-3 text-sky-400"></i>
                      <span>Lire le film</span>
                    </button>
                  </Link>
                  <div className="border-b border-gray-600/30"></div>
                </>
              )}

              {/* Voir les infos */}
              <Link href={`/movies/${movie.id}`}>
                <button 
                  onClick={() => setShowMobileMenu(false)}
                  className="w-full px-4 py-3 text-left text-white hover:bg-gray-700/50 transition-colors flex items-center"
                >
                  <i className="ti ti-info-circle text-xl mr-3 text-blue-400"></i>
                  <span>Voir les infos</span>
                </button>
              </Link>
              <div className="border-b border-gray-600/30"></div>

              {/* Watchlist */}
              <button 
                onClick={() => {
                  setShowMobileMenu(false);
                  toggleWatchlist({ preventDefault: () => {}, stopPropagation: () => {} } as any);
                }}
                disabled={isWatchlistLoading}
                className={`w-full px-4 py-3 text-left transition-colors flex items-center ${
                  isInWatchlist
                    ? 'text-blue-300 hover:bg-gray-700/50'
                    : 'text-white hover:bg-gray-700/50'
                } ${isWatchlistLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <i className={`ti ${isInWatchlist ? 'ti-bookmark-filled' : 'ti-bookmark'} text-xl mr-3 text-blue-400`}></i>
                <span>{isInWatchlist ? 'Retirer de ma liste' : 'Ajouter à ma liste'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />
    </>
  );
}
