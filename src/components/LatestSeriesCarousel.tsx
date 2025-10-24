'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Notification from './Notification';

interface Series {
  id: number;
  title: string;
  poster?: string;
  year?: number;
  rating?: number;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  genres?: string[];
  seasons?: Array<{
    id: number;
    number: number;
    episodes: Array<{
      id: number;
      videos?: Array<{
        id: number;
      }>;
    }>;
  }>;
}

export default function LatestSeriesCarousel() {
  const [series, setSeries] = useState<Series[]>([]);
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

  // Fonction pour vérifier si la série a des épisodes disponibles avec vidéos
  const hasAvailableEpisodes = (series: Series) => {
    return getAvailableEpisodes(series) > 0;
  };

  // Fonction pour vérifier le statut de la watchlist
  const checkWatchlistStatus = async (seriesId: number) => {
    try {
      const response = await fetch(`/api/watchlist/check?contentId=${seriesId}&contentType=SERIES`);
      const data = await response.json();
      if (data.success) {
        setWatchlistStatus(prev => ({
          ...prev,
          [seriesId]: data.data.isInWatchlist
        }));
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de la watchlist:', error);
    }
  };

  // Fonction pour ajouter/supprimer de la watchlist
  const toggleWatchlist = async (seriesId: number) => {
    setIsUpdatingWatchlist(seriesId);
    try {
      const isInWatchlist = watchlistStatus[seriesId];
      
      if (isInWatchlist) {
        // Supprimer de la watchlist
        const response = await fetch(`/api/watchlist?contentId=${seriesId}&contentType=SERIES`, {
          method: 'DELETE'
        });
        const data = await response.json();
        if (data.success) {
          setWatchlistStatus(prev => ({
            ...prev,
            [seriesId]: false
          }));
          showNotification('Série retirée de votre watchlist', 'info');
        }
      } else {
        // Ajouter à la watchlist
        const response = await fetch('/api/watchlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contentId: seriesId,
            contentType: 'SERIES'
          })
        });
        const data = await response.json();
        if (data.success) {
          setWatchlistStatus(prev => ({
            ...prev,
            [seriesId]: true
          }));
          showNotification('Série ajoutée à votre watchlist !', 'success');
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
    const fetchLatestSeries = async () => {
      try {
        const response = await fetch('/api/series/latest');
        const data = await response.json();
        
        if (data.success) {
          setSeries(data.data);
          // Vérifier le statut de la watchlist pour chaque série
          data.data.forEach((seriesItem: Series) => {
            checkWatchlistStatus(seriesItem.id);
          });
        }
      } catch (error) {
        console.error('Erreur lors du chargement des dernières séries:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLatestSeries();
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
      prevIndex >= series.length - itemsPerView ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    const itemsPerView = window.innerWidth < 768 ? 2.5 : 6;
    setCurrentIndex((prevIndex) => 
      prevIndex <= 0 ? Math.max(0, series.length - itemsPerView) : prevIndex - 1
    );
  };

  // Fonction pour calculer les épisodes disponibles avec vidéos
  const getAvailableEpisodes = (series: Series) => {
    if (!series.seasons) return 0;
    return series.seasons.reduce((total, season) => 
      total + (season.episodes ? season.episodes.filter(ep => ep.videos && ep.videos.length > 0).length : 0), 0
    );
  };

  if (isLoading) {
    return (
      <div className="relative">
        <div className="flex space-x-2 md:space-x-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex-shrink-0 w-32 h-48 md:w-48 md:h-72 bg-gray-800 rounded-lg animate-pulse">
              <div className="w-full h-full bg-gray-700 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (series.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Aucune série disponible</p>
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

      {/* Series Container */}
      <div className="overflow-x-auto scrollbar-hide md:overflow-hidden">
        <div 
          className="flex space-x-2 md:space-x-4 transition-transform duration-300 ease-in-out pl-2 md:pl-6 ml-4 md:ml-16 md:transform-none"
          style={{ 
            transform: window.innerWidth >= 768 ? `translateX(-${currentIndex * 208}px)` : 'none'
          }}
        >
          {series.map((seriesItem) => {
            const availableEpisodes = getAvailableEpisodes(seriesItem);
            return (
              <div key={seriesItem.id} className="flex-shrink-0 w-32 md:w-48 bg-gray-800 rounded-lg overflow-hidden hover:scale-105 transition-transform cursor-pointer group/series relative flex flex-col">
                {/* Poster Section */}
                <div className="relative h-48 md:h-72 overflow-hidden">
                  {/* Rating Badge */}
                  {seriesItem.rating && seriesItem.rating > 0 && (
                    <div className="absolute top-3 left-3 bg-yellow-500 text-black px-2 py-1 rounded-md text-xs font-bold shadow-lg flex items-center space-x-1 z-30">
                      <i className="ti ti-star-filled text-xs"></i>
                      <span>{Math.round(seriesItem.rating * 10) / 10}</span>
                    </div>
                  )}

                  {/* Mobile Menu Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setShowMobileMenu(showMobileMenu === seriesItem.id ? null : seriesItem.id);
                    }}
                    className="md:hidden absolute top-2 right-2 z-20 w-8 h-8 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center transition-colors"
                  >
                    <i className="ti ti-dots-circle-horizontal text-sm"></i>
                  </button>

                  <a
                    href={`/series/${seriesItem.id}`}
                    className="block w-full h-full md:block"
                    onClick={(e) => {
                      // Empêcher la redirection sur mobile
                      if (window.innerWidth < 768) {
                        e.preventDefault();
                      }
                    }}
                  >
                  {seriesItem.poster ? (
                    <div className="relative w-full h-full group-hover/series:brightness-75 transition-all duration-300">
                      <Image
                        src={seriesItem.poster.startsWith('http')
                          ? seriesItem.poster
                          : `https://image.tmdb.org/t/p/w500${seriesItem.poster}`
                        }
                        alt={seriesItem.title}
                        fill
                        className="object-cover"
                      />

                      {/* Play Icon Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/series:opacity-100 transition-opacity duration-300">
                        <div className="bg-sky-400 rounded-full w-12 h-12 md:w-16 md:h-16 flex items-center justify-center hover:bg-sky-500 transition-colors shadow-lg">
                          <i className="ti ti-player-play text-white text-2xl md:text-4xl drop-shadow-lg"></i>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                      <div className="text-center">
                        <i className="ti ti-device-tv text-2xl md:text-4xl text-gray-500 mb-2"></i>
                        <p className="text-gray-400 text-xs md:text-sm">{seriesItem.title}</p>
                      </div>
                    </div>
                  )}
                  </a>
                </div>

                {/* Series Info Section */}
                <div className="p-2 md:p-4 bg-black flex-1">
                  <h3 className="text-white font-semibold text-xs md:text-sm mb-2 line-clamp-2 group-hover/series:text-sky-400 transition-colors">
                    {seriesItem.title}
                  </h3>

                  <div className="flex items-center justify-between text-xs text-gray-300 mb-2">
                    <span className="font-medium">{seriesItem.year}</span>
                    <div className="flex flex-col items-end">
                      {seriesItem.genres && seriesItem.genres.length > 0 && (
                        <span className="text-sky-400 text-xs">
                          {seriesItem.genres[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

              {/* Mobile Dropdown Menu */}
              {showMobileMenu === seriesItem.id && (
                <div 
                  ref={dropdownRef}
                  className="md:hidden fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-lg border-t border-gray-600/50 shadow-2xl py-4 px-4 rounded-t-2xl z-50"
                >
                  {/* Series Info Header */}
                  <div className="mb-4 pb-4 border-b border-gray-600/30">
                    <div className="flex items-center space-x-3 mb-2">
                      {seriesItem.poster ? (
                        <div className="w-12 h-8 rounded overflow-hidden flex-shrink-0">
                          <Image
                            src={seriesItem.poster.startsWith('http') 
                              ? seriesItem.poster 
                              : `https://image.tmdb.org/t/p/w500${seriesItem.poster}`
                            }
                            alt={seriesItem.title}
                            width={48}
                            height={32}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      ) : null}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-sm truncate">{seriesItem.title}</h3>
                        {seriesItem.year && (
                          <p className="text-gray-300 text-xs">{seriesItem.year}</p>
                        )}
                        {seriesItem.rating && (
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="bg-yellow-600/80 text-white text-xs px-2 py-1 rounded flex items-center space-x-1">
                              <i className="ti ti-star-filled text-xs"></i>
                              <span>{Math.round(seriesItem.rating * 10) / 10}</span>
                            </span>
                            {availableEpisodes > 0 && (
                              <span className="bg-green-600/80 text-white text-xs px-2 py-1 rounded">
                                {availableEpisodes} épisode{availableEpisodes > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="space-y-3">
                    {hasAvailableEpisodes(seriesItem) && (
                      <button
                        onClick={() => {
                          window.location.href = `/series/${seriesItem.id}`;
                        }}
                        className="w-full text-left text-white hover:text-blue-400 transition-colors py-2"
                      >
                        <i className="ti ti-player-play mr-3"></i>
                        Lire la série
                      </button>
                    )}
                    <div className="border-b border-gray-600/30"></div>
                    <button
                      onClick={() => {
                        window.location.href = `/series/${seriesItem.id}`;
                      }}
                      className="w-full text-left text-white hover:text-blue-400 transition-colors py-2"
                    >
                      <i className="ti ti-info-circle mr-3"></i>
                      Voir les infos
                    </button>
                    <div className="border-b border-gray-600/30"></div>
                    <button
                      onClick={() => toggleWatchlist(seriesItem.id)}
                      disabled={isUpdatingWatchlist === seriesItem.id}
                      className="w-full text-left text-white hover:text-blue-400 transition-colors py-2 disabled:opacity-50"
                    >
                      <i className={`ti ${watchlistStatus[seriesItem.id] ? 'ti-bookmark-filled' : 'ti-bookmark'} mr-3`}></i>
                      {isUpdatingWatchlist === seriesItem.id ? 'Mise à jour...' : 
                       watchlistStatus[seriesItem.id] ? 'Retirer de ma liste' : 'Ajouter à ma liste'}
                    </button>
                  </div>
                </div>
              )}
            </div>
            );
          })}
        </div>
      </div>

      {/* Dots Indicator */}
      {series.length > 6 && (
        <div className="flex justify-center mt-4 space-x-2">
          {Array.from({ length: Math.ceil(series.length / (window.innerWidth < 768 ? 2.5 : 6)) }).map((_, index) => (
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
