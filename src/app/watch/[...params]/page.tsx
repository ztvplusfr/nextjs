'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Analytics } from "@vercel/analytics/next";
import Notification from '@/components/Notification';
import VideoBadges from '@/components/VideoBadges';

interface Episode {
  id: number;
  number: number;
  title: string;
  description?: string;
  duration?: number;
  airDate?: string;
  rating?: number;
  stillPath?: string;
  season: {
    id: number;
    number: number;
    series: {
      id: number;
      title: string;
      poster?: string;
    };
  };
  videos: Array<{
    id: number;
    title: string;
    embedUrl: string;
    quality?: string;
    language: string;
    type: string;
  }>;
}

interface Movie {
  id: number;
  title: string;
  description?: string;
  year?: number;
  rating?: number;
  duration?: number;
  poster?: string;
  backdrop?: string;
  videos: Array<{
    id: number;
    title: string;
    embedUrl: string;
    quality?: string;
    language: string;
    type: string;
  }>;
}

export default function WatchPage() {
  const params = useParams();
  const router = useRouter();
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [contentType, setContentType] = useState<'movie' | 'series' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [allEpisodes, setAllEpisodes] = useState<any[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [expandedEpisode, setExpandedEpisode] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    isVisible: boolean;
  }>({
    message: '',
    type: 'info',
    isVisible: false
  });
  

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
        setIsAuthLoading(false);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/auth/login');
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    // Ne pas charger le contenu tant que l'auth n'est pas vérifiée
    if (isAuthLoading) return;

    const fetchContent = async () => {
      try {
        setError(null);
        // Extraire les paramètres de l'URL
        const pathArray = params.params as string[];
        
        if (pathArray.length < 2) {
          setError('URL invalide');
          return;
        }

        const [type, contentId, seasonNumber, episodeNumber, videoId] = pathArray;
        
        if (type === 'movie') {
          setContentType('movie');
          await fetchMovie(parseInt(contentId), videoId);
        } else if (type === 'series') {
          setContentType('series');
          await fetchEpisode(parseInt(contentId), parseInt(seasonNumber), parseInt(episodeNumber), videoId);
        } else {
          setError('Type de contenu non supporté');
        }
      } catch (error) {
        console.error('Erreur lors du chargement du contenu:', error);
        setError('Erreur de connexion');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [params, router, isAuthLoading]);

  const fetchMovie = async (movieId: number, videoId?: string) => {
    try {
      const response = await fetch(`/api/movies/${movieId}`);
      
      if (!response.ok) {
        setError('Film non trouvé');
          return;
        }

      const data = await response.json();
      
      if (data.success && data.data) {
        const movieData = data.data;
        setMovie(movieData);
        
        
        // Sélectionner la vidéo spécifiée ou la première disponible
        if (videoId && movieData.videos) {
          const video = movieData.videos.find((v: any) => v.id === parseInt(videoId));
          if (video) {
            setSelectedVideo(video);
            recordHistory(video, 'MOVIE', movieData.id);
          } else {
            setSelectedVideo(movieData.videos[0]);
            recordHistory(movieData.videos[0], 'MOVIE', movieData.id);
          }
        } else if (movieData.videos && movieData.videos.length > 0) {
          setSelectedVideo(movieData.videos[0]);
          recordHistory(movieData.videos[0], 'MOVIE', movieData.id);
        } else {
          setError('Aucune vidéo disponible pour ce film');
        }
      } else {
        setError('Film non trouvé');
      }
    } catch (error) {
      console.error('Erreur lors du chargement du film:', error);
      setError('Erreur lors du chargement du film');
    }
  };

  const fetchEpisode = async (seriesId: number, seasonNumber: number, episodeNumber: number, videoId?: string) => {
    try {
        // Récupérer l'épisode avec ses vidéos
        const response = await fetch(`/api/series/${seriesId}/episodes?season=${seasonNumber}&episode=${episodeNumber}`);
        
        if (!response.ok) {
        setError('Épisode non trouvé');
          return;
        }

        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
          const episodeData = data.data[0];
          setEpisode(episodeData);
          setSelectedSeason(episodeData.season.number);
          
          
          // Sélectionner la vidéo spécifiée ou la première disponible
          if (videoId && episodeData.videos) {
            const video = episodeData.videos.find((v: any) => v.id === parseInt(videoId));
            if (video) {
              setSelectedVideo(video);
              recordHistory(video, 'SERIES', episodeData.season.series.id);
            } else {
              setSelectedVideo(episodeData.videos[0]);
              recordHistory(episodeData.videos[0], 'SERIES', episodeData.season.series.id);
            }
          } else if (episodeData.videos && episodeData.videos.length > 0) {
            setSelectedVideo(episodeData.videos[0]);
            recordHistory(episodeData.videos[0], 'SERIES', episodeData.season.series.id);
        } else {
          setError('Aucune vidéo disponible pour cet épisode');
          }
          
          // Récupérer tous les épisodes de la série
        await fetchAllEpisodes(seriesId);
        } else {
        setError('Épisode non trouvé');
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'épisode:', error);
      setError('Erreur lors du chargement de l\'épisode');
      }
    };

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

  const recordHistory = async (video: any, contentTypeOverride?: string, contentIdOverride?: number) => {
    try {
      const contentTypeUpper = contentTypeOverride || (contentType === 'movie' ? 'MOVIE' : 'SERIES');
      const contentId = contentIdOverride || (contentType === 'movie' ? movie?.id : episode?.season?.series?.id);

      // Vérifier que tous les paramètres nécessaires sont disponibles
      if (!contentId || !contentTypeUpper || !video?.id) {
        console.warn('Paramètres manquants pour l\'historique:', { contentId, contentTypeUpper, videoId: video?.id });
        return;
      }

      const response = await fetch('/api/history/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          contentId,
          contentType: contentTypeUpper,
          videoId: video.id
        })
      });

      if (!response.ok) {
        console.error('Erreur API historique:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'historique:', error);
    }
  };

  const selectVideo = (video: any) => {
    setSelectedVideo(video);
    recordHistory(video); // Les paramètres seront pris depuis l'état actuel
  };

  const fetchAllEpisodes = async (seriesId: number) => {
    try {
      const response = await fetch(`/api/series/${seriesId}/episodes`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAllEpisodes(data.data);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des épisodes:', error);
    }
  };

  const getCurrentEpisodeIndex = () => {
    if (!episode || !allEpisodes.length) return -1;
    return allEpisodes.findIndex(ep => ep.id === episode.id);
  };

  const getNextEpisode = () => {
    const currentIndex = getCurrentEpisodeIndex();
    if (currentIndex === -1 || currentIndex >= allEpisodes.length - 1) return null;
    
    // Chercher le prochain épisode avec des vidéos
    for (let i = currentIndex + 1; i < allEpisodes.length; i++) {
      if (allEpisodes[i].videos && allEpisodes[i].videos.length > 0) {
        return allEpisodes[i];
      }
    }
    return null;
  };

  const getPreviousEpisode = () => {
    const currentIndex = getCurrentEpisodeIndex();
    if (currentIndex <= 0) return null;
    
    // Chercher l'épisode précédent avec des vidéos
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (allEpisodes[i].videos && allEpisodes[i].videos.length > 0) {
        return allEpisodes[i];
      }
    }
    return null;
  };

  const goToNextEpisode = () => {
    const nextEpisode = getNextEpisode();
    if (nextEpisode) {
      router.push(`/watch/series/${nextEpisode.season.series.id}/${nextEpisode.season.number}/${nextEpisode.number}`);
    }
  };

  const goToPreviousEpisode = () => {
    const prevEpisode = getPreviousEpisode();
    if (prevEpisode) {
      router.push(`/watch/series/${prevEpisode.season.series.id}/${prevEpisode.season.number}/${prevEpisode.number}`);
    }
  };

  const toggleEpisodeExpansion = (episodeId: number) => {
    setExpandedEpisode(expandedEpisode === episodeId ? null : episodeId);
  };

  const goBack = () => {
    if (contentType === 'movie' && movie) {
      router.push(`/movies/${movie.id}`);
    } else if (contentType === 'series' && episode) {
      router.push(`/series/${episode.season.series.id}`);
    } else {
      router.push('/');
    }
  };

  // Affichage du loader pendant la vérification d'auth
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-white text-lg">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-96 h-64 bg-gray-800 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Erreur</h1>
          <p className="text-gray-400 mb-8">{error}</p>
          <button
            onClick={goBack}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  if (!episode && !movie) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Contenu non trouvé</h1>
          <p className="text-gray-400 mb-8">Le contenu que vous recherchez n'existe pas.</p>
          <button
            onClick={goBack}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  if (!selectedVideo) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Aucune vidéo disponible</h1>
          <p className="text-gray-400 mb-8">Cet épisode n'a pas de vidéo disponible.</p>
          <button
            onClick={goBack}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header avec informations de l'épisode */}
      <div className="bg-black/90 border-b border-gray-800 p-3 md:p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={goBack}
            className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors backdrop-blur-sm"
          >
            <i className="ti ti-arrow-left text-lg md:text-xl"></i>
          </button>
          
          <div className="text-left flex-1 ml-3 md:ml-4">
            <h1 className="text-white font-bold text-base md:text-lg lg:text-xl line-clamp-1">
              {contentType === 'movie' ? movie?.title : episode?.season.series.title}
            </h1>
            <p className="text-gray-300 text-xs md:text-sm line-clamp-1">
              {contentType === 'movie' 
                ? `Film • ${movie?.year || ''}`
                : `Saison ${episode?.season.number} • Épisode ${episode?.number} • ${episode?.title}`
              }
            </p>
          </div>
          
          {/* Boutons de navigation - Seulement pour les séries - Desktop uniquement */}
          {contentType === 'series' && (
            <div className="hidden md:flex items-center space-x-2">
            <button
              onClick={goToPreviousEpisode}
              disabled={!getPreviousEpisode()}
              className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 text-white px-3 py-2 rounded-md transition-all duration-300 backdrop-blur-sm flex items-center text-sm"
            >
              <i className="ti ti-chevron-left mr-1"></i>
              Précédent
            </button>
            <button
              onClick={goToNextEpisode}
              disabled={!getNextEpisode()}
              className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 text-white px-3 py-2 rounded-md transition-all duration-300 backdrop-blur-sm flex items-center text-sm"
            >
              Suivant
              <i className="ti ti-chevron-right ml-1"></i>
            </button>
          </div>
          )}
        </div>
      </div>

      {/* Layout principal */}
      <div className="flex flex-col md:flex-row h-[calc(100vh-80px)]">
        {/* Lecteur vidéo - Partie principale */}
        <div className="flex-1 bg-black">
          <div className="h-full flex flex-col">
            {/* Lecteur vidéo */}
            <div className="bg-black h-[35vh] md:h-full md:flex-1">
              <iframe
                width="100%"
                height="100%"
                src={`https://api-stream.ztvplus.workers.dev/player?url=${encodeURIComponent(selectedVideo.embedUrl)}`}
                title={`${contentType === 'movie' ? movie?.title : episode?.title} - ${selectedVideo.title}`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>

            
            {/* Informations du contenu - Sous le lecteur */}
            <div className="bg-black/90 border-t border-gray-800 p-3 md:p-4">
              <div className="flex items-start space-x-3 md:space-x-4">
                {/* Poster du contenu */}
                {(() => {
                  const poster = contentType === 'movie' ? movie?.poster : episode?.season.series.poster;
                  const title = contentType === 'movie' ? movie?.title : episode?.season.series.title;
                  
                  if (!poster) return null;
                  
                  const imageSrc = poster.startsWith('http') 
                    ? poster 
                    : `https://image.tmdb.org/t/p/w500${poster}`;
                  
                  return (
                    <div className="flex-shrink-0 w-12 h-16 md:w-16 md:h-24">
                      <Image
                        src={imageSrc}
                        alt={title || 'Poster'}
                        width={64}
                        height={96}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  );
                })()}
                
                {/* Informations textuelles */}
                <div className="flex-1">
                  <h2 className="text-white font-bold text-sm md:text-lg mb-1 md:mb-2 line-clamp-1">
                    {contentType === 'movie' ? movie?.title : episode?.title}
                  </h2>
                  
                  <div className="flex items-center space-x-2 md:space-x-4 text-xs md:text-sm text-gray-300 mb-1 md:mb-2">
                    {(contentType === 'movie' ? movie?.duration : episode?.duration) && (
                      <span className="flex items-center">
                        <i className="ti ti-clock mr-1"></i>
                        {(() => {
                          const duration = contentType === 'movie' ? movie?.duration : episode?.duration;
                          return duration && duration >= 60 
                            ? `${Math.floor(duration / 60)}h ${duration % 60}min`
                            : `${duration}min`;
                        })()}
                      </span>
                    )}
                    {(contentType === 'movie' ? movie?.year : episode?.airDate) && (
                      <span className="flex items-center">
                        <i className="ti ti-calendar mr-1"></i>
                        {contentType === 'movie' 
                          ? movie?.year 
                          : episode?.airDate && new Date(episode.airDate).toLocaleDateString('fr-FR')
                        }
                      </span>
                    )}
                    {(contentType === 'movie' ? movie?.rating : episode?.rating) && (
                      <span className="flex items-center">
                        <i className="ti ti-star-filled text-yellow-400 mr-1"></i>
                        {(contentType === 'movie' ? movie?.rating : episode?.rating)?.toFixed(1)}
                      </span>
                    )}
                  </div>
                  
                  {(contentType === 'movie' ? movie?.description : episode?.description) && (
                    <p className="text-gray-300 text-xs md:text-sm leading-relaxed line-clamp-2">
                      {contentType === 'movie' ? movie?.description : episode?.description}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Badges de la vidéo sélectionnée */}
              {selectedVideo && (
                <div className="mt-3 md:mt-4">
                  <VideoBadges 
                    video={selectedVideo} 
                    className="justify-start"
                  />
                </div>
              )}
              
              {/* Boutons de navigation mobile - Seulement pour les séries */}
              {contentType === 'series' && (
                <div className="md:hidden mt-4 flex items-center justify-center space-x-3">
                  <button
                    onClick={goToPreviousEpisode}
                    disabled={!getPreviousEpisode()}
                    className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 text-white px-4 py-2 rounded-md transition-all duration-300 backdrop-blur-sm flex items-center text-sm flex-1 justify-center"
                  >
                    <i className="ti ti-chevron-left mr-2"></i>
                    Précédent
                  </button>
                  <button
                    onClick={goToNextEpisode}
                    disabled={!getNextEpisode()}
                    className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 text-white px-4 py-2 rounded-md transition-all duration-300 backdrop-blur-sm flex items-center text-sm flex-1 justify-center"
                  >
                    Suivant
                    <i className="ti ti-chevron-right ml-2"></i>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Liste des vidéos/épisodes - Partie droite */}
        <div className="w-full md:w-80 bg-black border-t md:border-l border-gray-800 overflow-y-auto">
          <div className="p-3 md:p-4">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-white font-semibold text-base md:text-lg">
                {contentType === 'movie' ? 'Vidéos' : 'Épisodes'}
              </h3>
              
              {/* Sélecteur de saison - Seulement pour les séries */}
              {contentType === 'series' && (
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(parseInt(e.target.value))}
                  className="bg-gray-800 border border-gray-600 text-white px-2 md:px-3 py-1 rounded text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from(new Set(allEpisodes.map(ep => ep.season.number))).sort().map(seasonNum => (
                  <option key={seasonNum} value={seasonNum}>
                    Saison {seasonNum}
                  </option>
                ))}
              </select>
              )}
            </div>
            
            <div className="space-y-2">
              {contentType === 'movie' ? (
                // Affichage des vidéos pour les films
                movie?.videos?.map((video) => (
                  <div
                    key={video.id}
                    className={`rounded-xl transition-colors ${
                      selectedVideo?.id === video.id
                        ? 'bg-gray-800 border border-blue-600'
                        : 'bg-gray-900 border border-gray-700'
                    }`}
                  >
                    <button
                      onClick={() => selectVideo(video)}
                      className="w-full p-2 md:p-3 text-left hover:bg-gray-800/50 transition-all duration-300 backdrop-blur-sm rounded-xl"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-white font-medium text-xs md:text-sm mb-1 line-clamp-1">
                            {video.title}
                          </h4>
                          <div className="flex items-center space-x-1 md:space-x-2 text-xs text-gray-400">
                            {video.quality && (
                              <span className="flex items-center">
                                <i className="ti ti-video mr-1"></i>
                                {video.quality}
                              </span>
                            )}
                            <span className="flex items-center">
                              <i className="ti ti-world mr-1"></i>
                              {video.language}
                            </span>
                            <span className="flex items-center">
                              <i className="ti ti-tag mr-1"></i>
                              {video.type}
                            </span>
                          </div>
                        </div>
                        {selectedVideo?.id === video.id && (
                          <div className="bg-blue-600/80 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm border border-blue-500/30">
                            En cours
                          </div>
                        )}
                      </div>
                    </button>
                  </div>
                ))
              ) : (
                // Affichage des épisodes pour les séries
                allEpisodes
                .filter(ep => ep.season.number === selectedSeason && ep.videos && ep.videos.length > 0)
                .map((ep) => (
                  <div
                    key={ep.id}
                    className={`rounded-xl transition-colors ${
                      episode && ep.id === episode.id
                        ? 'bg-gray-800 border border-blue-600'
                        : 'bg-gray-900 border border-gray-700'
                    }`}
                  >
                    {/* Header de l'épisode - Clickable */}
                    <div 
                      className={`p-2 md:p-3 cursor-pointer hover:bg-gray-800/50 transition-all duration-300 backdrop-blur-sm ${
                        expandedEpisode === ep.id ? 'rounded-t-xl' : 'rounded-xl'
                      }`}
                      onClick={() => toggleEpisodeExpansion(ep.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 text-left">
                          <h4 className="text-white font-medium text-xs md:text-sm line-clamp-1">
                            Épisode {ep.number} - {ep.title}
                          </h4>
                          <div className="flex items-center space-x-1 md:space-x-2 mt-1">
                            <span className="text-gray-400 text-xs">
                              {ep.videos.length} vidéo{ep.videos.length > 1 ? 's' : ''}
                            </span>
                            {ep.duration && (
                              <span className="text-gray-500 text-xs">
                                {ep.duration >= 60 
                                  ? `${Math.floor(ep.duration / 60)}h ${ep.duration % 60}min`
                                  : `${ep.duration}min`
                                }
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
                          {episode && ep.id === episode.id && (
                            <div className="bg-blue-600/80 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm border border-blue-500/30">
                              En cours
                            </div>
                          )}
                          <i className={`ti ti-chevron-down text-gray-400 transition-transform duration-200 text-sm ${
                            expandedEpisode === ep.id ? 'rotate-180' : ''
                          }`}></i>
                        </div>
                      </div>
                    </div>
                    
                    {/* Liste des vidéos - Seulement si l'épisode est étendu */}
                    {expandedEpisode === ep.id && ep.videos && ep.videos.length > 0 && (
                      <div className="border-t border-gray-700 bg-gray-800/30 rounded-b-xl">
                        <div className="p-2 md:p-3">
                          <div className="space-y-2">
                            {ep.videos.map((video: { id: number; title: string; embedUrl: string; quality?: string; language: string; type: string; }) => (
                              <button
                                key={video.id}
                                onClick={() => {
                                  router.push(`/watch/series/${ep.season.series.id}/${ep.season.number}/${ep.number}/${video.id}`);
                                }}
                                className="w-full text-left bg-gray-700 hover:bg-gray-600 rounded-xl p-2 md:p-3 transition-all duration-300 backdrop-blur-sm group"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <h5 className="text-white font-medium text-xs md:text-sm mb-1 line-clamp-1">
                                      {video.title}
                                    </h5>
                                    <div className="flex items-center space-x-2 md:space-x-3 text-xs text-gray-400">
                                      {video.quality && (
                                        <span className="flex items-center">
                                          <i className="ti ti-video mr-1"></i>
                                          {video.quality}
                                        </span>
                                      )}
                                      {video.language && (
                                        <span className="flex items-center">
                                          <i className="ti ti-world mr-1"></i>
                                          {video.language.toUpperCase()}
                                        </span>
                                      )}
                                      <span className="flex items-center">
                                        <i className="ti ti-tag mr-1"></i>
                                        {video.type}
                                      </span>
                                    </div>
                                  </div>
                                  <i className="ti ti-external-link text-gray-400 group-hover:text-white transition-colors text-sm"></i>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
              
              {contentType === 'movie' ? (
                movie?.videos?.length === 0 && (
                  <div className="text-center py-6 md:py-8">
                    <p className="text-gray-400 text-xs md:text-sm">
                      Aucune vidéo disponible pour ce film
                    </p>
                  </div>
                )
              ) : (
                allEpisodes.filter(ep => ep.season.number === selectedSeason && ep.videos && ep.videos.length > 0).length === 0 && (
                  <div className="text-center py-6 md:py-8">
                    <p className="text-gray-400 text-xs md:text-sm">
                    Aucun épisode disponible pour cette saison
                  </p>
                </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sélecteur de vidéo (si plusieurs vidéos disponibles) */}
      {((contentType === 'movie' && movie?.videos && movie.videos.length > 1) || 
        (contentType === 'series' && episode?.videos && episode.videos.length > 1)) && (
        <div className="absolute top-16 md:top-20 right-2 md:right-4 z-20">
          <div className="bg-black/80 backdrop-blur-sm rounded-lg p-3 md:p-4 max-w-xs">
            <h3 className="text-white font-semibold mb-2 md:mb-3 text-sm md:text-base">Qualité</h3>
            <div className="space-y-1 md:space-y-2">
              {(contentType === 'movie' ? movie?.videos : episode?.videos)?.map((video) => (
                <button
                  key={video.id}
                  onClick={() => selectVideo(video)}
                  className={`w-full text-left p-2 rounded transition-colors ${
                    selectedVideo.id === video.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm font-medium line-clamp-1">{video.title}</span>
                    <div className="flex items-center space-x-1 md:space-x-2 text-xs">
                      {video.quality && (
                        <span className="bg-gray-600 px-1 md:px-2 py-1 rounded text-xs">
                          {video.quality}
                        </span>
                      )}
                      <span className="bg-gray-600 px-1 md:px-2 py-1 rounded text-xs">
                        {video.language.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
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
      <Analytics />
    </div>
  );
}
