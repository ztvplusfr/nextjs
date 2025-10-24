'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Notification from './Notification';

interface Series {
  id: number;
  title: string;
  originalTitle?: string;
  description?: string;
  year?: number;
  rating?: number;
  poster?: string;
  backdrop?: string;
  releaseDate?: string;
  genres: string[];
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  videos?: Array<{
    id: number;
    title: string;
    embedUrl: string;
    quality?: string;
    language: string;
    type: string;
  }>;
}

interface SeriesCardProps {
  series: Series;
}

export default function SeriesCard({ series }: SeriesCardProps) {
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
        const response = await fetch(`/api/watchlist/check?contentId=${series.id}&contentType=SERIES`, {
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
  }, [series.id]);

  const toggleWatchlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isWatchlistLoading) return;
    
    setIsWatchlistLoading(true);
    try {
      if (isInWatchlist) {
        // Supprimer de la watchlist
        const response = await fetch(`/api/watchlist?contentId=${series.id}&contentType=SERIES`, {
          method: 'DELETE',
          credentials: 'include',
        });
        
        if (response.ok) {
          setIsInWatchlist(false);
          showNotification('Série supprimée de votre watchlist', 'success');
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
            contentId: series.id,
            contentType: 'SERIES'
          })
        });
        
        if (response.ok) {
          setIsInWatchlist(true);
          showNotification('Série ajoutée à votre watchlist', 'success');
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
    if (!series.poster) return '/placeholder-series.jpg';
    if (series.poster.startsWith('http')) return series.poster;
    return `https://image.tmdb.org/t/p/w500${series.poster}`;
  };

  const getYear = () => {
    if (series.year) return series.year;
    if (series.releaseDate) return new Date(series.releaseDate).getFullYear();
    return null;
  };

  const currentYear = new Date().getFullYear();

  const hasAvailableVideos = () => {
    return series?.videos && series.videos.length > 0;
  };

  return (
    <>
      <div className="group block">
        <div className="relative bg-gray-800 rounded-lg overflow-hidden hover:scale-105 transition-transform">
          {series.poster ? (
            <div className="aspect-[2/3] relative">
              <Image
                src={getPosterUrl()}
                alt={series.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ) : (
            <div className="aspect-[2/3] bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
              <div className="text-center">
                <i className="ti ti-device-tv text-4xl text-gray-500 mb-2"></i>
                <p className="text-gray-400 text-sm">{series.title}</p>
              </div>
            </div>
          )}
          
          {/* Play Icon Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-sky-400 rounded-full p-3 md:p-4 hover:bg-sky-500 transition-colors">
              <i className="ti ti-player-play text-white text-2xl md:text-4xl drop-shadow-lg"></i>
            </div>
          </div>
          
          {/* Genres Overlay */}
          {series.genres && series.genres.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex flex-wrap gap-1">
                {series.genres.slice(0, 3).map((genre, index) => (
                  <span key={index} className="px-2 py-1 bg-sky-500/20 text-sky-300 text-xs rounded-full">
                    {genre}
                  </span>
                ))}
                {series.genres.length > 3 && (
                  <span className="px-2 py-1 bg-gray-500/20 text-gray-300 text-xs rounded-full">
                    +{series.genres.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}

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
        
        {/* Info below card */}
        <div className="mt-3">
          <h3 className="font-semibold text-white text-sm mb-1 line-clamp-2 group-hover:text-sky-300 transition-colors">
            {series.title}
          </h3>
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            {series.year && <span>{series.year}</span>}
            {series.rating && (
              <span className="flex items-center">
                <i className="ti ti-star-filled text-yellow-400 mr-1"></i>
                {Math.round(series.rating * 10) / 10}
              </span>
            )}
            {series.numberOfSeasons && (
              <span>{series.numberOfSeasons} saison{series.numberOfSeasons > 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
      </div>

      {/* Menu mobile dropdown */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setShowMobileMenu(false)}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
          <div className="absolute bottom-0 left-0 right-0 bg-black/95 backdrop-blur-lg border-t border-gray-600/50 shadow-2xl py-4 px-4 rounded-t-2xl">
            <div className="space-y-0">
              {/* Lire la série */}
              {hasAvailableVideos() && (
                <>
                  <Link href={`/watch/series/${series.id}/${series.videos![0].id}`}>
                    <button 
                      onClick={() => setShowMobileMenu(false)}
                      className="w-full px-4 py-3 text-left text-white hover:bg-gray-700/50 transition-colors flex items-center"
                    >
                      <i className="ti ti-player-play text-xl mr-3 text-sky-400"></i>
                      <span>Lire la série</span>
                    </button>
                  </Link>
                  <div className="border-b border-gray-600/30"></div>
                </>
              )}

              {/* Voir les infos */}
              <Link href={`/series/${series.id}`}>
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
