'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import SimilarMoviesCarousel from './SimilarMoviesCarousel';
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
  trailer?: string;
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

interface MovieDetailProps {
  movieId: string;
}

export default function MovieDetail({ movieId }: MovieDetailProps) {
  const router = useRouter();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isWatchlistLoading, setIsWatchlistLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
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
    const fetchMovie = async () => {
      try {
        const response = await fetch(`/api/movies/${movieId}`);
        const data = await response.json();
        
        if (data.success) {
          setMovie(data.data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement du film:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const checkWatchlistStatus = async () => {
      try {
        const response = await fetch(`/api/watchlist/check?contentId=${movieId}&contentType=MOVIE`, {
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

    const checkLikeStatus = async () => {
      try {
        const response = await fetch(`/api/likes/check?contentId=${movieId}&contentType=MOVIE`, {
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

    fetchMovie();
    checkWatchlistStatus();
    checkLikeStatus();
  }, [movieId]);

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

  const toggleWatchlist = async () => {
    if (isWatchlistLoading) return;
    
    setIsWatchlistLoading(true);
    try {
      if (isInWatchlist) {
        // Supprimer de la watchlist
        const response = await fetch(`/api/watchlist?contentId=${movieId}&contentType=MOVIE`, {
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
            contentId: parseInt(movieId),
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

  const toggleLike = async () => {
    if (isLikeLoading) return;
    
    setIsLikeLoading(true);
    try {
      if (isLiked) {
        // Supprimer le like
        const response = await fetch(`/api/likes?contentId=${movieId}&contentType=MOVIE`, {
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
            contentId: parseInt(movieId),
            contentType: 'MOVIE'
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsLiked(true);
          setLikeCount(data.data.likeCount);
          showNotification('Film liké', 'success');
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

  const handlePlayVideo = (videoId: number) => {
    router.push(`/watch/movie/${movieId}/${videoId}`);
  };

  const hasAvailableVideos = () => {
    return movie?.videos && movie.videos.length > 0;
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

  if (!movie) {
    return (
      <div className="relative min-h-screen -mt-16 pt-16 flex items-center justify-center bg-black">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Film non trouvé</h1>
            <p className="text-gray-400">Le film que vous recherchez n&apos;existe pas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen -mt-16 pt-16">
      {/* Background Image - Limited height on mobile */}
      <div className="absolute inset-0 md:inset-0">
        {movie.backdrop ? (
          <Image
            src={movie.backdrop.startsWith('http') 
              ? movie.backdrop 
              : `https://image.tmdb.org/t/p/original${movie.backdrop}`
            }
            alt={movie.title}
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
        
        {/* Netflix-style transition gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black via-black/95 to-transparent"></div>
        
        {/* Mobile: Enhanced transition */}
        <div className="md:hidden absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black via-black/98 to-transparent"></div>
      </div>
      
      {/* Mobile: Black background for content below description */}
      <div className="md:hidden absolute inset-0 bg-black transition-opacity duration-500" style={{ top: 'calc(100vh - 400px)' }}></div>

      {/* Content */}
      <div className="relative z-10 min-h-[60vh] flex items-center md:items-center">
        <div className="w-full px-4 md:px-6 py-16 md:py-16">
          <div className="max-w-2xl ml-4 md:ml-16">
            
            {/* Title */}
            <h1 className="relative z-10 text-2xl sm:text-4xl md:text-6xl font-bold text-white mb-3 md:mb-4 leading-tight drop-shadow-2xl">
              {movie.title}
            </h1>

            {/* Meta Info */}
            <div className="relative z-10 flex flex-wrap items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <span className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs md:text-sm px-3 py-1.5 rounded-full flex items-center space-x-1 shadow-lg border border-green-400/30">
                <i className="ti ti-star-filled text-xs"></i>
                <span className="font-semibold">
                  {movie.rating ? `${Math.round(movie.rating * 10) / 10}/10` : 'N/A'}
                </span>
              </span>
              <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs md:text-sm px-3 py-1.5 rounded-full flex items-center space-x-1 shadow-lg border border-blue-400/30">
                <i className="ti ti-calendar text-xs"></i>
                <span className="font-semibold">
                  {movie.year || new Date(movie.releaseDate || '').getFullYear()}
                </span>
              </span>
              {movie.duration && (
                <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs md:text-sm px-3 py-1.5 rounded-full flex items-center space-x-1 shadow-lg border border-orange-400/30">
                  <i className="ti ti-clock text-xs"></i>
                  <span className="font-semibold">
                    {Math.floor(movie.duration / 60)}h {movie.duration % 60}min
                  </span>
                </span>
              )}
              <span className="bg-gradient-to-r from-pink-500 to-pink-600 text-white text-xs md:text-sm px-3 py-1.5 rounded-full flex items-center space-x-1 shadow-lg border border-pink-400/30">
                <i className="ti ti-tags text-xs"></i>
                <span className="font-semibold">
                  {movie.genres.slice(0, 2).join(', ')}
                </span>
              </span>
            </div>

            {/* Description */}
            <p className="relative z-10 text-sm md:text-lg text-gray-300 mb-6 md:mb-8 leading-relaxed line-clamp-2 md:line-clamp-3 drop-shadow-lg">
              {movie.description || 'Description non disponible.'}
            </p>

            {/* Action Buttons */}
            <div className="relative z-10 flex flex-col sm:flex-row gap-3 md:gap-4 mb-6 md:mb-8">
              {movie.trailer && (
                <button 
                  onClick={() => setIsPlaying(true)}
                  className="backdrop-blur-sm font-semibold px-6 py-3 rounded-md transition-colors flex items-center justify-center drop-shadow-lg border text-sm bg-sky-500/30 text-sky-300 border-sky-600/50 hover:bg-sky-500/40 whitespace-nowrap"
                >
                  <i className="ti ti-player-play mr-2 text-base"></i>
                  <span>Bande annonce</span>
                </button>
              )}
              <button 
                onClick={toggleWatchlist}
                disabled={isWatchlistLoading}
                className={`backdrop-blur-sm font-semibold px-6 py-3 rounded-md transition-colors flex items-center justify-center drop-shadow-lg border text-sm whitespace-nowrap ${
                  isInWatchlist
                    ? 'bg-blue-500/30 text-blue-300 border-blue-600/50 hover:bg-blue-500/40'
                    : 'bg-gray-500/30 text-gray-300 border-gray-600/50 hover:bg-gray-500/40'
                } ${isWatchlistLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <i className={`ti ${isInWatchlist ? 'ti-bookmark-filled' : 'ti-bookmark'} mr-2 text-base`}></i>
                <span>{isInWatchlist ? 'Dans ma liste' : 'Ajouter'}</span>
              </button>
              <button 
                onClick={toggleLike}
                disabled={isLikeLoading}
                className={`backdrop-blur-sm font-semibold px-6 py-3 rounded-md transition-colors flex items-center justify-center drop-shadow-lg border text-sm whitespace-nowrap ${
                  isLiked
                    ? 'bg-green-500/30 text-green-300 border-green-600/50 hover:bg-red-500/40 hover:text-red-300 hover:border-red-600/50'
                    : 'bg-gray-500/30 text-gray-300 border-gray-600/50 hover:bg-gray-500/40'
                } ${isLikeLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <i className={`ti ${isLiked ? 'ti-heart-filled' : 'ti-heart'} mr-2 text-base`}></i>
                <span>{isLiked ? 'Liked' : 'Like'} ({likeCount})</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Videos Section */}
      {hasAvailableVideos() && (
        <div className="relative z-10 w-full px-4 md:px-6 py-6 md:py-8 bg-black md:bg-transparent -mt-20 md:-mt-16">
          <div className="max-w-4xl ml-4 md:ml-16">
            <div className="mb-4 md:mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2">Vidéos disponibles</h2>
              <p className="text-sm md:text-base text-gray-400">Choisissez la qualité et la langue de votre choix</p>
            </div>
            
            <div className="space-y-2 md:space-y-3">
              {movie.videos?.map((video) => (
                <div
                  key={video.id}
                  className="bg-gray-900/80 backdrop-blur-md rounded-lg p-3 md:p-4 border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:bg-gray-800/80"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-base md:text-lg mb-2 line-clamp-2">
                        {video.title}
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2 md:mb-3">
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
                      onClick={() => handlePlayVideo(video.id)}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2 px-4 md:px-6 rounded-full transition-all duration-300 flex items-center justify-center text-sm md:text-base w-full sm:w-auto shadow-lg border border-blue-500/30"
                    >
                      <i className="ti ti-player-play mr-2"></i>
                      Regarder ce film
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Similar Movies Grid - Full Width */}
      <div className="relative z-10 w-full px-4 md:px-6 bg-black md:bg-transparent mt-8 md:mt-0 pb-16">
        <div className="w-full ml-4 md:ml-16">
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Titres similaires</h2>
            <p className="text-sm md:text-base text-gray-400">Découvrez d'autres films qui pourraient vous plaire</p>
          </div>
          <SimilarMoviesCarousel movieId={movieId} maxItems={10} />
        </div>
      </div>

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
            <div className="w-full h-full flex items-center justify-center p-2">
              {movie.trailer ? (
                <div className="w-full max-w-7xl aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${movie.trailer}?autoplay=1&rel=0&modestbranding=1&showinfo=0`}
                    title={`Bande annonce de ${movie.title}`}
                    className="w-full h-full rounded-lg"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="text-center text-white">
                  <i className="ti ti-video text-6xl mb-4"></i>
                  <p className="text-xl">Bande annonce non disponible</p>
                  <p className="text-gray-400 mt-2">Aucune bande annonce trouvée pour ce film</p>
                </div>
              )}
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
