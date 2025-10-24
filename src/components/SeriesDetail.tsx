'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
// import SimilarSeriesCarousel from '@/components/SimilarSeriesCarousel';
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
  trailer?: string;
  firstAirDate?: string;
  lastAirDate?: string;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  status?: string;
  genres: string[];
  seasons: Array<{
    id: number;
    number: number;
    title?: string;
    description?: string;
    poster?: string;
    airDate?: string;
    episodeCount: number;
    episodes: Array<{
      id: number;
      number: number;
      title: string;
      description?: string;
      duration?: number;
      airDate?: string;
      rating?: number;
      stillPath?: string;
      videos?: Array<{
        id: number;
        title: string;
        embedUrl: string;
        quality?: string;
        language: string;
        type: string;
      }>;
    }>;
  }>;
}

interface SeriesDetailProps {
  seriesId: string;
}

export default function SeriesDetail({ seriesId }: SeriesDetailProps) {
  const [series, setSeries] = useState<Series | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isWatchlistLoading, setIsWatchlistLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [expandedEpisode, setExpandedEpisode] = useState<number | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    isVisible: boolean;
  }>({
    message: '',
    type: 'info',
    isVisible: false
  });

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        const response = await fetch(`/api/series/${seriesId}`);
        const data = await response.json();
        
        if (data.success) {
          setSeries(data.data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la série:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const checkWatchlistStatus = async () => {
      try {
        const response = await fetch(`/api/watchlist/check?contentId=${seriesId}&contentType=SERIES`, {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsInWatchlist(data.data.isInWatchlist);
        } else {
          console.error('Erreur watchlist:', response.status, await response.text());
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de la watchlist:', error);
      }
    };

    const checkLikeStatus = async () => {
      try {
        const response = await fetch(`/api/likes/check?contentId=${seriesId}&contentType=SERIES`, {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsLiked(data.data.isLiked);
          setLikeCount(data.data.likeCount);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du like:', error);
      }
    };

    fetchSeries();
    checkWatchlistStatus();
    checkLikeStatus();
  }, [seriesId]);

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

  const toggleEpisodeExpansion = (episodeId: number) => {
    setExpandedEpisode(expandedEpisode === episodeId ? null : episodeId);
  };

  const toggleWatchlist = async () => {
    if (isWatchlistLoading) return;
    
    setIsWatchlistLoading(true);
    try {
      if (isInWatchlist) {
        // Supprimer de la watchlist
        const response = await fetch(`/api/watchlist?contentId=${seriesId}&contentType=SERIES`, {
          method: 'DELETE',
          credentials: 'include',
        });
        
        if (response.ok) {
          setIsInWatchlist(false);
          showNotification('Série supprimée de votre watchlist', 'success');
        } else {
          console.error('Erreur suppression:', await response.text());
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
            contentId: parseInt(seriesId),
            contentType: 'SERIES'
          })
        });
        
        if (response.ok) {
          setIsInWatchlist(true);
          showNotification('Série ajoutée à votre watchlist', 'success');
        } else {
          console.error('Erreur ajout:', await response.text());
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

  const toggleLike = async () => {
    if (isLikeLoading) return;
    
    setIsLikeLoading(true);
    try {
      if (isLiked) {
        // Supprimer le like
        const response = await fetch(`/api/likes?contentId=${seriesId}&contentType=SERIES`, {
          method: 'DELETE',
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsLiked(false);
          setLikeCount(data.data.likeCount);
          showNotification('Like supprimé', 'success');
        } else {
          showNotification('Erreur lors de la suppression du like', 'error');
        }
      } else {
        // Ajouter le like
        const response = await fetch('/api/likes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            contentId: parseInt(seriesId),
            contentType: 'SERIES'
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsLiked(true);
          setLikeCount(data.data.likeCount);
          showNotification('Série likée', 'success');
        } else {
          showNotification('Erreur lors de l\'ajout du like', 'error');
        }
      }
    } catch (error) {
      console.error('Erreur lors de la modification du like:', error);
      showNotification('Erreur de connexion', 'error');
    } finally {
      setIsLikeLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="relative min-h-screen -mt-16 pt-16">
        <div className="absolute inset-0 bg-gray-900 animate-pulse"></div>
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="animate-pulse">
            <div className="w-96 h-64 bg-gray-800 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="relative min-h-screen -mt-16 pt-16 flex items-center justify-center bg-black">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Série non trouvée</h1>
          <p className="text-gray-400">La série que vous recherchez n&apos;existe pas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen -mt-16 pt-16">
      {/* Background Image */}
      <div className="absolute inset-0">
        {series.backdrop ? (
          <Image
            src={series.backdrop.startsWith('http') 
              ? series.backdrop 
              : `https://image.tmdb.org/t/p/original${series.backdrop}`
            }
            alt={series.title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
        
        {/* Netflix-style transition gradient with blur effect */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black via-black/95 to-transparent backdrop-blur-sm"></div>
        
        {/* Enhanced blur transition */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/90 via-black/70 to-transparent backdrop-blur-md"></div>
        
        {/* Mobile: Enhanced transition with stronger blur */}
        <div className="md:hidden absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black via-black/98 to-transparent backdrop-blur-lg"></div>
        
        {/* Final transition layer */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black via-black/95 to-transparent backdrop-blur-sm"></div>
      </div>
      
      {/* Mobile: Black background for content below description with blur */}
      <div className="md:hidden absolute inset-0 bg-black/95 backdrop-blur-sm transition-opacity duration-700" style={{ top: 'calc(100vh - 400px)' }}></div>

      {/* Content */}
      <div className="relative z-10 min-h-[60vh] flex items-center md:items-center">
        <div className="w-full px-4 md:px-6 py-16 md:py-16">
          <div className="max-w-2xl ml-4 md:ml-16">
            
            {/* Title */}
            <h1 className="relative z-10 text-2xl sm:text-4xl md:text-6xl font-bold text-white mb-3 md:mb-4 leading-tight drop-shadow-2xl">
              {series.title}
            </h1>

            {/* Meta Info */}
            <div className="relative z-10 flex flex-wrap items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <span className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs md:text-sm px-3 py-1.5 rounded-full flex items-center space-x-1 shadow-lg border border-green-400/30">
                <i className="ti ti-star-filled text-xs"></i>
                <span className="font-semibold">
                  {series.rating ? `${Math.round(series.rating * 10) / 10}/10` : 'N/A'}
                </span>
              </span>
              <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs md:text-sm px-3 py-1.5 rounded-full flex items-center space-x-1 shadow-lg border border-blue-400/30">
                <i className="ti ti-calendar text-xs"></i>
                <span className="font-semibold">
                  {series.year || new Date(series.firstAirDate || '').getFullYear()}
                </span>
              </span>
              {(() => {
                const availableSeasons = series.seasons ? 
                  series.seasons.filter(season => 
                    season.episodes && season.episodes.some(ep => ep.videos && ep.videos.length > 0)
                  ).length : 0;
                return availableSeasons > 0 ? (
                <span className="bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs md:text-sm px-3 py-1.5 rounded-full flex items-center space-x-1 shadow-lg border border-purple-400/30">
                  <i className="ti ti-device-tv text-xs"></i>
                  <span className="font-semibold">
                    {availableSeasons} saison{availableSeasons > 1 ? 's' : ''}
                  </span>
                </span>
                ) : null;
              })()}
              {(() => {
                const availableEpisodes = series.seasons ? 
                  series.seasons.reduce((total, season) => 
                    total + (season.episodes ? season.episodes.filter(ep => ep.videos && ep.videos.length > 0).length : 0), 0
                  ) : 0;
                return availableEpisodes > 0 ? (
                  <span className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-xs md:text-sm px-3 py-1.5 rounded-full flex items-center space-x-1 shadow-lg border border-indigo-400/30">
                    <i className="ti ti-playlist text-xs"></i>
                    <span className="font-semibold">
                      {availableEpisodes} épisode{availableEpisodes > 1 ? 's' : ''}
                    </span>
                  </span>
                ) : null;
              })()}
              <span className="bg-gradient-to-r from-pink-500 to-pink-600 text-white text-xs md:text-sm px-3 py-1.5 rounded-full flex items-center space-x-1 shadow-lg border border-pink-400/30">
                <i className="ti ti-tags text-xs"></i>
                <span className="font-semibold">
                  {series.genres.slice(0, 2).join(', ')}
                </span>
              </span>
            </div>

            {/* Description */}
            <p className="relative z-10 text-sm md:text-lg text-gray-300 mb-6 md:mb-8 leading-relaxed line-clamp-2 md:line-clamp-3 drop-shadow-lg">
              {series.description || 'Description non disponible.'}
            </p>

            {/* Action Buttons */}
            <div className="relative z-10 flex flex-col sm:flex-row gap-3 md:gap-4 mb-6 md:mb-8">
              <button 
                onClick={toggleWatchlist}
                disabled={isWatchlistLoading}
                className={`backdrop-blur-sm font-semibold px-4 md:px-8 py-2 md:py-3 rounded-md transition-colors flex items-center justify-center drop-shadow-lg border text-sm md:text-base ${
                  isInWatchlist
                    ? 'bg-blue-500/30 text-blue-300 border-blue-600/50 hover:bg-blue-500/40'
                    : 'bg-gray-500/30 text-gray-300 border-gray-600/50 hover:bg-gray-500/40'
                } ${isWatchlistLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <i className={`ti ${isInWatchlist ? 'ti-bookmark-filled' : 'ti-bookmark'} mr-1 md:mr-2 text-lg md:text-xl`}></i>
                <span className="hidden sm:inline">{isInWatchlist ? 'Dans ma watchlist' : 'Ajouter à ma watchlist'}</span>
                <span className="sm:hidden">{isInWatchlist ? 'Dans ma liste' : 'Ajouter'}</span>
              </button>
              <button 
                onClick={toggleLike}
                disabled={isLikeLoading}
                className={`backdrop-blur-sm font-semibold px-4 md:px-8 py-2 md:py-3 rounded-md transition-colors flex items-center justify-center drop-shadow-lg border text-sm md:text-base ${
                  isLiked
                    ? 'bg-green-500/30 text-green-300 border-green-600/50 hover:bg-red-500/40 hover:text-red-300 hover:border-red-600/50'
                    : 'bg-gray-500/30 text-gray-300 border-gray-600/50 hover:bg-gray-500/40'
                } ${isLikeLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <i className={`ti ${isLiked ? 'ti-heart-filled' : 'ti-heart'} mr-1 md:mr-2 text-lg md:text-xl`}></i>
                <span className="hidden sm:inline">
                  {isLiked ? 'J\'aime' : 'J\'aime'} ({likeCount})
                </span>
                <span className="sm:hidden">
                  {isLiked ? 'Liked' : 'Like'} ({likeCount})
                </span>
              </button>
            </div>


          </div>
        </div>
      </div>

      {/* Episodes List - Netflix Style */}
      {series.seasons && series.seasons.length > 0 && (
        <div className="relative z-10 w-full px-4 md:px-6 bg-black md:bg-transparent -mt-20 md:-mt-16">
          <div className="ml-4 md:ml-16 mr-4 md:mr-16">
            {/* Title and Season Selector */}
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="flex items-center">
                <div className="w-1 h-6 md:h-8 bg-blue-500 rounded-full mr-3 md:mr-4"></div>
                <h3 className="text-white font-bold text-xl md:text-3xl">Les Épisodes</h3>
              </div>
              <div className="flex items-center">
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(parseInt(e.target.value))}
                  className="bg-black border border-white text-white px-3 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                >
                  {series.seasons.map((season) => (
                    <option key={season.id} value={season.number}>
                      Saison {season.number}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-4 pb-8">
              {series.seasons
                .find(season => season.number === selectedSeason)
                ?.episodes
                .filter(episode => episode.videos && episode.videos.length > 0)
                .map((episode) => (
                  <div key={episode.id} className="bg-gray-900/80 backdrop-blur-md rounded-lg border border-gray-700/30 hover:bg-gray-800/80 transition-all duration-300 overflow-hidden group">
                    {/* Episode Header - Clickable */}
                    <div 
                      className="flex flex-col md:flex-row h-auto md:h-32 cursor-pointer"
                      onClick={() => toggleEpisodeExpansion(episode.id)}
                    >
                      {/* Episode Still Image - Full Width on Mobile, Side on Desktop */}
                      <div className="flex-shrink-0 w-full md:w-56 h-48 md:h-full bg-gray-800 overflow-hidden relative group/image cursor-pointer">
                        {episode.stillPath ? (
                          <Image
                            src={episode.stillPath.startsWith('http') 
                              ? episode.stillPath 
                              : `https://image.tmdb.org/t/p/w500${episode.stillPath}`
                            }
                            alt={episode.title}
                            width={224}
                            height={128}
                            className="w-full h-full object-cover group-hover/image:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                            <i className="ti ti-device-tv text-gray-500 text-3xl"></i>
                          </div>
                        )}
                        
                        {/* Play Icon Overlay - Always Visible */}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="bg-white/90 rounded-full p-2 md:p-3 hover:bg-white transition-colors w-12 h-12 md:w-16 md:h-16 flex items-center justify-center">
                            <i className="ti ti-player-play text-black text-lg md:text-xl"></i>
                          </div>
                        </div>
                      </div>
                      
                      {/* Episode Content - Full Width on Mobile */}
                      <div className="flex-1 p-3 md:p-4 flex flex-col justify-center h-full">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            {/* Episode Number - Reduced Size, Next to Title */}
                            <div className="text-lg md:text-2xl font-bold text-transparent mr-2 md:mr-3" style={{
                              WebkitTextStroke: '1.5px white',
                              textShadow: '0 0 8px rgba(255,255,255,0.4)'
                            }}>
                              {episode.number}
                            </div>
                            <h4 className="text-white font-semibold text-sm md:text-lg line-clamp-1 group-hover:text-blue-400 transition-colors flex-1">
                              {episode.title}
                            </h4>
                          </div>
                          <div className="flex items-center space-x-2 md:space-x-3 mb-2 md:mb-3">
                            {episode.duration && (
                              <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs px-2.5 py-1 rounded-full flex items-center space-x-1 shadow-md border border-orange-400/30">
                                <i className="ti ti-clock text-xs"></i>
                                <span className="font-medium">
                                  {episode.duration >= 60 
                                    ? `${Math.floor(episode.duration / 60)}h ${episode.duration % 60}min`
                                    : `${episode.duration}min`
                                  }
                                </span>
                              </span>
                            )}
                            {episode.airDate && (
                              <span className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-xs px-2.5 py-1 rounded-full flex items-center space-x-1 shadow-md border border-cyan-400/30">
                                <i className="ti ti-calendar text-xs"></i>
                                <span className="font-medium">
                                  {new Date(episode.airDate).toLocaleDateString('fr-FR')}
                                </span>
                              </span>
                            )}
                            {episode.rating && (
                              <span className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white text-xs px-2.5 py-1 rounded-full flex items-center space-x-1 shadow-md border border-yellow-400/30">
                                <i className="ti ti-star-filled text-xs"></i>
                                <span className="font-medium">{episode.rating.toFixed(1)}</span>
                              </span>
                            )}
                          </div>
                          {episode.description && (
                            <p className="text-gray-300 text-sm line-clamp-2 leading-tight">
                              {episode.description}
                            </p>
                          )}
                        </div>
                      </div>
                      
                    </div>
                    
                    {/* Videos Section - Only when expanded */}
                    {expandedEpisode === episode.id && episode.videos && episode.videos.length > 0 && (
                      <div className="border-t border-gray-700/30 bg-gray-800/30 backdrop-blur-md">
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-white font-semibold text-sm">Vidéos disponibles</h4>
                            <span className="text-gray-400 text-xs">
                              {episode.videos.length} vidéo{episode.videos.length > 1 ? 's' : ''}
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            {episode.videos.map((video) => (
                              <div
                                key={video.id}
                                className="bg-gray-800/50 hover:bg-gray-700/50 rounded-lg p-3 transition-colors group/video backdrop-blur-sm"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <h5 className="text-white font-medium text-sm group-hover/video:text-blue-400 transition-colors">
                                      {video.title}
                                    </h5>
                                    <div className="flex items-center space-x-2 mt-1">
                                      {video.quality && (
                                        <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs px-3 py-1.5 rounded-full flex items-center space-x-1 shadow-lg border border-blue-400/30">
                                          <i className="ti ti-badge-hd text-xs"></i>
                                          <span className="font-medium">{video.quality}</span>
                                        </span>
                                      )}
                                      <span className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs px-3 py-1.5 rounded-full flex items-center space-x-1 shadow-lg border border-emerald-400/30">
                                        <i className="ti ti-language text-xs"></i>
                                        <span className="font-medium">
                                          {video.language === 'fr' ? 'Français' : 
                                           video.language === 'en' ? 'Anglais' : 
                                           video.language === 'es' ? 'Espagnol' : 
                                           video.language === 'de' ? 'Allemand' : 
                                           video.language === 'it' ? 'Italien' : 
                                           video.language === 'pt' ? 'Portugais' : 
                                           video.language === 'ru' ? 'Russe' : 
                                           video.language === 'ja' ? 'Japonais' : 
                                           video.language === 'ko' ? 'Coréen' : 
                                           video.language === 'zh' ? 'Chinois' : 
                                           video.language.toUpperCase()}
                                        </span>
                                      </span>
                                      <span className="bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs px-3 py-1.5 rounded-full flex items-center space-x-1 shadow-lg border border-purple-400/30">
                                        <i className="ti ti-video text-xs"></i>
                                        <span className="font-medium">{video.type}</span>
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => window.location.href = `/watch/series/${series.id}/${selectedSeason}/${episode.number}/${video.id}`}
                                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2 px-4 rounded-full transition-all duration-300 flex items-center justify-center text-sm shadow-lg border border-blue-500/30"
                                  >
                                    <i className="ti ti-player-play mr-2"></i>
                                    Regarder cet épisode
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )) || (
                  <div className="text-center py-12">
                    <div className="bg-gray-900/50 rounded-lg p-8">
                      <i className="ti ti-device-tv text-4xl text-gray-500 mb-4"></i>
                      <p className="text-gray-400 text-lg">Aucun épisode disponible avec vidéo pour cette saison</p>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Video Player (if playing) */}
      {isPlaying && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <div className="relative w-full h-full">
            <button
              onClick={() => setIsPlaying(false)}
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
            >
              <i className="ti ti-x text-xl"></i>
            </button>
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-white">
                <i className="ti ti-device-tv text-6xl mb-4"></i>
                <p className="text-xl">Lecteur vidéo en cours de développement</p>
                <p className="text-gray-400 mt-2">La série &quot;{series.title}&quot; sera bientôt disponible</p>
              </div>
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
    </div>
  );
}
