'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Notification from './Notification';

interface Episode {
  id: number;
  title: string;
  poster?: string;
  stillPath?: string;
  year?: number;
  rating?: number;
  duration?: number;
  seasonNumber?: number;
  episodeNumber?: number;
  seriesTitle?: string;
  seriesId?: number;
  videos?: Array<{
    id: number;
    createdAt: string;
  }>;
}

export default function LatestEpisodesCarousel() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMobileMenu, setShowMobileMenu] = useState<number | null>(null);
  const [watchlistStatus, setWatchlistStatus] = useState<{[key: number]: boolean}>({});
  const [isUpdatingWatchlist, setIsUpdatingWatchlist] = useState<number | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    isVisible: boolean;
  }>({
    message: '',
    type: 'info',
    isVisible: false
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Fonction pour vérifier si l'épisode a des vidéos disponibles
  const hasAvailableVideos = (episode: Episode) => {
    return episode.videos && episode.videos.length > 0;
  };

  // Fonction pour calculer le temps écoulé depuis la publication
  const getTimeAgo = (createdAt: string) => {
    const now = new Date();
    const videoDate = new Date(createdAt);
    const diffInMs = now.getTime() - videoDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h`;
    } else {
      return `${diffInDays}j`;
    }
  };

  // Fonction pour obtenir la date de création la plus récente
  const getLatestVideoDate = (episode: Episode) => {
    if (!episode.videos || episode.videos.length === 0) return null;
    const latestVideo = episode.videos.reduce((latest, video) => 
      new Date(video.createdAt) > new Date(latest.createdAt) ? video : latest
    );
    return latestVideo.createdAt;
  };

  // Fonction pour vérifier le statut de la watchlist
  const checkWatchlistStatus = async (episodeId: number) => {
    try {
      const response = await fetch(`/api/watchlist/check?contentId=${episodeId}&contentType=EPISODE`);
      const data = await response.json();
      if (data.success) {
        setWatchlistStatus(prev => ({
          ...prev,
          [episodeId]: data.data.isInWatchlist
        }));
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de la watchlist:', error);
    }
  };

  // Fonction pour ajouter/supprimer de la watchlist
  const toggleWatchlist = async (episodeId: number) => {
    setIsUpdatingWatchlist(episodeId);
    try {
      const isInWatchlist = watchlistStatus[episodeId];
      
      if (isInWatchlist) {
        // Supprimer de la watchlist
        const response = await fetch(`/api/watchlist?contentId=${episodeId}&contentType=EPISODE`, {
          method: 'DELETE'
        });
        const data = await response.json();
        if (data.success) {
          setWatchlistStatus(prev => ({
            ...prev,
            [episodeId]: false
          }));
          showNotification('Épisode retiré de votre watchlist', 'info');
        }
      } else {
        // Ajouter à la watchlist
        const response = await fetch('/api/watchlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contentId: episodeId,
            contentType: 'EPISODE'
          })
        });
        const data = await response.json();
        if (data.success) {
          setWatchlistStatus(prev => ({
            ...prev,
            [episodeId]: true
          }));
          showNotification('Épisode ajouté à votre watchlist !', 'success');
        }
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la watchlist:', error);
    } finally {
      setIsUpdatingWatchlist(null);
      setShowMobileMenu(null);
    }
  };

  useEffect(() => {
    const fetchLatestEpisodes = async () => {
      try {
        const response = await fetch('/api/episodes/latest');
        const data = await response.json();
        
        if (data.success) {
          setEpisodes(data.data);
          // Vérifier le statut de la watchlist pour chaque épisode
          data.data.forEach((episode: Episode) => {
            checkWatchlistStatus(episode.id);
          });
        }
      } catch (error) {
        console.error('Erreur lors du chargement des derniers épisodes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLatestEpisodes();
  }, []);

  // Gérer la fermeture du dropdown en cliquant en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMobileMenu(null);
      }
    };

    if (showMobileMenu !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMobileMenu]);

  const nextSlide = () => {
    const itemsPerView = window.innerWidth < 768 ? 2.5 : 6;
    setCurrentIndex((prevIndex) => 
      prevIndex >= episodes.length - itemsPerView ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    const itemsPerView = window.innerWidth < 768 ? 2.5 : 6;
    setCurrentIndex((prevIndex) => 
      prevIndex <= 0 ? Math.max(0, episodes.length - itemsPerView) : prevIndex - 1
    );
  };

  if (isLoading) {
    return (
      <div className="relative">
        <div className="flex space-x-2 md:space-x-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex-shrink-0 w-48 h-32 md:w-64 md:h-40 bg-gray-800 rounded-lg animate-pulse">
              <div className="w-full h-full bg-gray-700 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (episodes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Aucun épisode disponible</p>
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* Navigation Arrows - Masquées sur mobile */}
      <button
        onClick={prevSlide}
        className="hidden md:block absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-black/70 hover:bg-black/90 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <i className="ti ti-chevron-left text-xl"></i>
      </button>
      
      <button
        onClick={nextSlide}
        className="hidden md:block absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-black/70 hover:bg-black/90 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <i className="ti ti-chevron-right text-xl"></i>
      </button>

      {/* Episodes Container */}
      <div className="overflow-x-auto scrollbar-hide md:overflow-hidden">
        <div 
          className="flex space-x-2 md:space-x-4 transition-transform duration-300 ease-in-out pl-2 md:pl-6 ml-4 md:ml-16 md:transform-none"
          style={{ 
            transform: window.innerWidth >= 768 ? `translateX(-${currentIndex * 208}px)` : 'none'
          }}
        >
          {episodes.map((episode) => (
            <div key={episode.id} className="flex-shrink-0 w-48 md:w-64 bg-gray-800 rounded-lg overflow-hidden hover:scale-105 transition-transform cursor-pointer group/episode relative flex flex-col">
              {/* Poster Section */}
              <div className="relative h-32 md:h-40 overflow-hidden">
                {/* Mobile Menu Button - Coin inférieur droit */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setShowMobileMenu(showMobileMenu === episode.id ? null : episode.id);
                  }}
                  className="md:hidden absolute bottom-2 right-2 z-20 w-8 h-8 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center transition-colors"
                >
                  <i className="ti ti-dots-circle-horizontal text-sm"></i>
                </button>

                      <a
                        href={`/watch/series/${episode.seriesId}/${episode.seasonNumber}/${episode.episodeNumber}`}
                        className="block w-full h-full md:block"
                        onClick={(e) => {
                          // Empêcher la redirection sur mobile
                          if (window.innerWidth < 768) {
                            e.preventDefault();
                          }
                        }}
                      >
              {(episode.stillPath || episode.poster) ? (
                <div className="relative w-full h-full group-hover/episode:brightness-75 transition-all duration-300">
                  <Image
                    src={episode.stillPath
                      ? `https://image.tmdb.org/t/p/w500${episode.stillPath}`
                      : episode.poster?.startsWith('http')
                        ? episode.poster
                        : `https://image.tmdb.org/t/p/w500${episode.poster}`
                    }
                    alt={episode.title}
                    fill
                    className="object-cover"
                  />

                  {/* Season/Episode Badge - Coin supérieur gauche */}
                  {episode.seasonNumber && episode.episodeNumber && (
                    <div className="absolute top-2 left-2 bg-blue-600/95 backdrop-blur-sm rounded-lg px-3 py-0.5 border border-blue-400/50 shadow-lg">
                      <span className="text-white text-xs font-black tracking-wide">
                        S{episode.seasonNumber}E{episode.episodeNumber}
                      </span>
                    </div>
                  )}

                  {/* Time Badge - Coin supérieur droit */}
                  {getLatestVideoDate(episode) && (
                    <div className="absolute top-2 right-2 bg-red-600/95 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-red-400/50 shadow-lg">
                      <div className="flex items-center space-x-1">
                        <i className="ti ti-clock text-white text-xs"></i>
                        <span className="text-white text-xs font-bold">
                          {getTimeAgo(getLatestVideoDate(episode)!)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Play Icon Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/episode:opacity-100 transition-opacity duration-300">
                    <div className="bg-sky-400 rounded-full w-12 h-12 md:w-16 md:h-16 flex items-center justify-center hover:bg-sky-500 transition-colors shadow-lg">
                      <i className="ti ti-player-play text-white text-2xl md:text-4xl drop-shadow-lg"></i>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                  <div className="text-center">
                    <i className="ti ti-device-tv text-xl md:text-2xl text-gray-500 mb-1"></i>
                    <p className="text-gray-400 text-xs">{episode.title}</p>
                  </div>
                </div>
              )}
              </a>
              </div>

              {/* Episode Info Section */}
              <div className="p-2 md:p-4 bg-black flex-1">
                <h3 className="text-white font-semibold text-xs md:text-sm mb-2 line-clamp-2 group-hover/episode:text-sky-400 transition-colors">
                  {episode.title}
                </h3>

                {episode.seriesTitle && (
                  <div className="text-xs text-gray-400 mb-2">
                    {episode.seriesTitle}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-300">
                  <span className="font-medium">{episode.year}</span>
                  <div className="flex flex-col items-end">
                    {episode.rating && (
                      <div className="flex items-center mb-1">
                        <i className="ti ti-star-filled text-sky-400 mr-1 text-xs"></i>
                        <span className="text-sky-400 font-bold text-xs">
                          {Math.round(episode.rating * 10) / 10}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Mobile Dropdown Menu */}
              {showMobileMenu === episode.id && (
                <div 
                  ref={dropdownRef}
                  className="md:hidden fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-lg border-t border-gray-600/50 shadow-2xl py-4 px-4 rounded-t-2xl z-50"
                >
                  {/* Episode Info Header */}
                  <div className="mb-4 pb-4 border-b border-gray-600/30">
                    <div className="flex items-center space-x-3 mb-2">
                      {episode.stillPath || episode.poster ? (
                        <div className="w-12 h-8 rounded overflow-hidden flex-shrink-0">
                          <Image
                            src={episode.stillPath 
                              ? `https://image.tmdb.org/t/p/w500${episode.stillPath}`
                              : episode.poster?.startsWith('http') 
                                ? episode.poster 
                                : `https://image.tmdb.org/t/p/w500${episode.poster}`
                            }
                            alt={episode.title}
                            width={48}
                            height={32}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      ) : null}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-sm truncate">{episode.title}</h3>
                        {episode.seriesTitle && (
                          <p className="text-gray-300 text-xs truncate">{episode.seriesTitle}</p>
                        )}
                        {episode.seasonNumber && episode.episodeNumber && (
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="bg-blue-600/80 text-white text-xs px-2 py-1 rounded">
                              S{episode.seasonNumber}E{episode.episodeNumber}
                            </span>
                            {getLatestVideoDate(episode) && (
                              <span className="bg-red-600/80 text-white text-xs px-2 py-1 rounded flex items-center space-x-1">
                                <i className="ti ti-clock text-xs"></i>
                                <span>{getTimeAgo(getLatestVideoDate(episode)!)}</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="space-y-3">
                    {hasAvailableVideos(episode) && (
                      <button
                        onClick={() => {
                          window.location.href = `/watch/series/${episode.id}`;
                        }}
                        className="w-full text-left text-white hover:text-blue-400 transition-colors py-2"
                      >
                        <i className="ti ti-player-play mr-3"></i>
                        Lire l'épisode
                      </button>
                    )}
                    <div className="border-b border-gray-600/30"></div>
                    <button
                      onClick={() => {
                        window.location.href = `/watch/series/${episode.id}`;
                      }}
                      className="w-full text-left text-white hover:text-blue-400 transition-colors py-2"
                    >
                      <i className="ti ti-info-circle mr-3"></i>
                      Voir les infos
                    </button>
                    <div className="border-b border-gray-600/30"></div>
                    <button
                      onClick={() => toggleWatchlist(episode.id)}
                      disabled={isUpdatingWatchlist === episode.id}
                      className="w-full text-left text-white hover:text-blue-400 transition-colors py-2 disabled:opacity-50"
                    >
                      <i className={`ti ${watchlistStatus[episode.id] ? 'ti-bookmark-filled' : 'ti-bookmark'} mr-3`}></i>
                      {isUpdatingWatchlist === episode.id ? 'Mise à jour...' : 
                       watchlistStatus[episode.id] ? 'Retirer de ma liste' : 'Ajouter à ma liste'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Dots Indicator */}
      {episodes.length > 6 && (
        <div className="flex justify-center mt-4 space-x-2">
          {Array.from({ length: Math.ceil(episodes.length / (window.innerWidth < 768 ? 2.5 : 6)) }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index * (window.innerWidth < 768 ? 2.5 : 6))}
              className={`w-2 h-2 rounded-full transition-colors ${
                Math.floor(currentIndex / (window.innerWidth < 768 ? 2.5 : 6)) === index ? 'bg-white' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
      )}

      {/* Notification */}
      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />
    </div>
  );
}
