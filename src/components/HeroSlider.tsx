'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Notification from './Notification';

interface FeaturedContent {
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
  firstAirDate?: string;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  status?: string;
  type: 'movie' | 'series';
  genres: string[];
  videos?: Array<{
    id: number;
    title: string;
    embedUrl: string;
    quality?: string;
    language: string;
    type: string;
  }>;
  seasons?: Array<{
    id: number;
    number: number;
    episodes: Array<{
      id: number;
      number: number;
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

interface HeroSliderProps {
  onLoad?: () => void;
}

export default function HeroSlider({ onLoad }: HeroSliderProps) {
  const router = useRouter();
  const [featuredContent, setFeaturedContent] = useState<FeaturedContent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [watchlistStatus, setWatchlistStatus] = useState<{[key: string]: boolean}>({});
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    isVisible: boolean;
  }>({
    message: '',
    type: 'info',
    isVisible: false
  });
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    const fetchFeaturedContent = async () => {
      try {
        // Utiliser le cache si disponible, sinon faire une nouvelle requête
        const response = await fetch('/api/featured', {
          cache: 'force-cache'
        });
        const data = await response.json();
        
        if (data.success) {
          setFeaturedContent(data.data);
          onLoad?.(); // Notifier que le composant est chargé
        }
      } catch (error) {
        console.error('Erreur lors du chargement du contenu en vedette:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedContent();
  }, [onLoad]);

  // Vérifier si l'utilisateur est connecté
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
      }
    };

    checkAuth();
  }, []);

  // Auto-play du slider
  useEffect(() => {
    if (featuredContent.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => 
          prevIndex === featuredContent.length - 1 ? 0 : prevIndex + 1
        );
      }, 10000); // Change toutes les 10 secondes

      return () => clearInterval(interval);
    }
  }, [featuredContent.length]);

  // Vérifier le statut de la watchlist pour tous les contenus (seulement si connecté)
  useEffect(() => {
    const checkAllWatchlistStatus = async () => {
      if (featuredContent.length > 0 && user) {
        const statusPromises = featuredContent.map(async (content) => {
          const isInWatchlist = await checkWatchlistStatus(content.id, content.type);
          return { key: `${content.id}-${content.type.toUpperCase()}`, value: isInWatchlist };
        });
        
        const statuses = await Promise.all(statusPromises);
        const statusObject = statuses.reduce((acc, { key, value }) => {
          acc[key] = value;
          return acc;
        }, {} as {[key: string]: boolean});
        
        setWatchlistStatus(statusObject);
      } else if (!user) {
        // Réinitialiser le statut si l'utilisateur n'est pas connecté
        setWatchlistStatus({});
      }
    };

    checkAllWatchlistStatus();
  }, [featuredContent, user]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const nextSlide = () => {
    setCurrentIndex(currentIndex === featuredContent.length - 1 ? 0 : currentIndex + 1);
  };

  const prevSlide = () => {
    setCurrentIndex(currentIndex === 0 ? featuredContent.length - 1 : currentIndex - 1);
  };

  // Fonctions pour le swipe tactile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    }
    if (isRightSwipe) {
      prevSlide();
    }
  };

  // Fonction pour vérifier le statut de la watchlist
  const checkWatchlistStatus = async (contentId: number, contentType: string) => {
    try {
      const contentTypeUpper = contentType.toUpperCase();
      const response = await fetch(`/api/watchlist/check?contentId=${contentId}&contentType=${contentTypeUpper}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.data.isInWatchlist;
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de la watchlist:', error);
    }
    return false;
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

  // Fonction pour vérifier si le contenu a des vidéos disponibles
  const hasAvailableVideos = (content: FeaturedContent): boolean => {
    if (content.type === 'movie') {
      return !!(content.videos && content.videos.length > 0);
    } else if (content.type === 'series') {
      return !!(content.seasons && content.seasons.some(season => 
        season.episodes && season.episodes.some(episode => 
          episode.videos && episode.videos.length > 0
        )
      ));
    }
    return false;
  };

  // Fonction pour obtenir le premier épisode disponible
  const getFirstAvailableEpisode = (content: FeaturedContent) => {
    if (content.type === 'series' && content.seasons) {
      // Trier les saisons par numéro
      const sortedSeasons = [...content.seasons].sort((a, b) => a.number - b.number);
      
      for (const season of sortedSeasons) {
        if (season.episodes) {
          // Trier les épisodes par numéro
          const sortedEpisodes = [...season.episodes].sort((a, b) => a.number - b.number);
          
          for (const episode of sortedEpisodes) {
            if (episode.videos && episode.videos.length > 0) {
              return { season, episode };
            }
          }
        }
      }
    }
    return null;
  };

  // Fonction pour lancer la lecture
  const handlePlay = (content: FeaturedContent) => {
    if (content.type === 'movie' && content.videos && content.videos.length > 0) {
      // Pour un film, rediriger vers la page de lecture avec la première vidéo
      const firstVideo = content.videos[0];
      router.push(`/watch/movie/${content.id}/${firstVideo.id}`);
    } else if (content.type === 'series') {
      const firstEpisode = getFirstAvailableEpisode(content);
      if (firstEpisode) {
        // Pour une série, rediriger vers la page de lecture du premier épisode disponible
        router.push(`/watch/series/${content.id}/${firstEpisode.season.number}/${firstEpisode.episode.number}`);
      }
    }
  };

  // Fonction pour rediriger vers la page de détail
  const goToDetail = (content: FeaturedContent) => {
    if (content.type === 'movie') {
      router.push(`/movies/${content.id}`);
    } else if (content.type === 'series') {
      router.push(`/series/${content.id}`);
    }
  };

  // Fonction pour ajouter/supprimer de la watchlist
  const toggleWatchlist = async (contentId: number, contentType: string) => {
    const contentTypeUpper = contentType.toUpperCase();
    const isInWatchlist = watchlistStatus[`${contentId}-${contentTypeUpper}`];
    
    try {
      if (isInWatchlist) {
        // Supprimer de la watchlist
        const response = await fetch(`/api/watchlist?contentId=${contentId}&contentType=${contentTypeUpper}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        
        if (response.ok) {
          setWatchlistStatus(prev => ({
            ...prev,
            [`${contentId}-${contentTypeUpper}`]: false
          }));
          showNotification('Contenu supprimé de votre watchlist', 'success');
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
            contentId,
            contentType: contentTypeUpper
          })
        });
        
        if (response.ok) {
          setWatchlistStatus(prev => ({
            ...prev,
            [`${contentId}-${contentTypeUpper}`]: true
          }));
          showNotification('Contenu ajouté à votre watchlist', 'success');
        } else {
          showNotification('Erreur lors de l\'ajout', 'error');
        }
      }
    } catch (error) {
      console.error('Erreur lors de la modification de la watchlist:', error);
      showNotification('Erreur de connexion', 'error');
    }
  };

  if (isLoading) {
    return null;
  }

  if (featuredContent.length === 0) {
    return (
      <section className="relative h-[70vh] md:h-[85vh] flex items-center justify-center bg-black -mt-16 pt-16">
        <div className="text-center px-4">
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-4">Aucun contenu en vedette</h1>
          <p className="text-gray-400 text-sm md:text-base">Ajoutez du contenu en vedette depuis l&apos;administration</p>
        </div>
      </section>
    );
  }

  const currentContent = featuredContent[currentIndex];

  return (
    <section 
      className="relative h-[70vh] md:h-[85vh] overflow-hidden -mt-16 pt-16"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        {currentContent.backdrop ? (
          <Image
            src={currentContent.backdrop.startsWith('http') 
              ? currentContent.backdrop 
              : `https://image.tmdb.org/t/p/original${currentContent.backdrop}`
            }
            alt={currentContent.title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent md:from-black/80 md:via-black/40"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent md:from-black/60"></div>
        <div className="absolute bottom-0 left-0 right-0 h-24 md:h-32 bg-gradient-to-t from-black via-black/90 to-transparent"></div>
      </div>

      {/* Content - Positioned at bottom left */}
      <div className="relative z-10 h-full flex items-end">
        <div className="w-full px-4 md:px-6 pb-8 md:pb-16">
          <div className="max-w-2xl ml-4 md:ml-16">
            {/* Title */}
            <h1 className="text-2xl md:text-4xl lg:text-6xl font-bold text-white mb-3 md:mb-4 leading-tight drop-shadow-2xl">
              {currentContent.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <span className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs md:text-sm px-3 py-1.5 rounded-full flex items-center space-x-1 shadow-lg border border-green-400/30">
                <i className="ti ti-star-filled text-xs"></i>
                <span className="font-semibold">
                  {currentContent.rating ? `${Math.round(currentContent.rating * 10) / 10}/10` : 'N/A'}
                </span>
              </span>
              <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs md:text-sm px-3 py-1.5 rounded-full flex items-center space-x-1 shadow-lg border border-blue-400/30">
                <i className="ti ti-calendar text-xs"></i>
                <span className="font-semibold">
                  {currentContent.year || new Date(currentContent.releaseDate || currentContent.firstAirDate || '').getFullYear()}
                </span>
              </span>
              <span className="bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs md:text-sm px-3 py-1.5 rounded-full flex items-center space-x-1 shadow-lg border border-purple-400/30">
                <i className={`ti ${currentContent.type === 'series' ? 'ti-device-tv' : 'ti-movie'} text-xs`}></i>
                <span className="font-semibold">
                  {currentContent.type === 'series' 
                    ? (() => {
                        const availableEpisodes = currentContent.seasons ? 
                          currentContent.seasons.reduce((total, season) => 
                            total + (season.episodes ? season.episodes.filter(ep => ep.videos && ep.videos.length > 0).length : 0), 0
                          ) : 0;
                        return `${availableEpisodes} épisode${availableEpisodes > 1 ? 's' : ''}`;
                      })()
                    : 'Film'
                  }
                </span>
              </span>
              {currentContent.duration && (
                <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs md:text-sm px-3 py-1.5 rounded-full flex items-center space-x-1 shadow-lg border border-orange-400/30">
                  <i className="ti ti-clock text-xs"></i>
                  <span className="font-semibold">
                    {Math.floor(currentContent.duration / 60)}h {currentContent.duration % 60}min
                  </span>
                </span>
              )}
              <span className="bg-gradient-to-r from-pink-500 to-pink-600 text-white text-xs md:text-sm px-3 py-1.5 rounded-full flex items-center space-x-1 shadow-lg border border-pink-400/30">
                <i className="ti ti-tags text-xs"></i>
                <span className="font-semibold">
                  {currentContent.genres.slice(0, 2).join(', ')}
                </span>
              </span>
            </div>

            {/* Description */}
            <p className="text-sm md:text-lg text-gray-300 mb-6 md:mb-8 leading-relaxed line-clamp-2 md:line-clamp-3 drop-shadow-lg">
              {currentContent.description || 'Description non disponible.'}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
              {/* Mobile: Lecture + Info + Watchlist côte à côte */}
              <div className="flex gap-2 md:contents">
                <button 
                  onClick={() => handlePlay(currentContent)}
                  disabled={!hasAvailableVideos(currentContent)}
                  className={`flex-1 md:flex-none font-semibold px-6 md:px-8 py-2 md:py-3 rounded-md transition-colors flex items-center justify-center drop-shadow-lg text-sm md:text-base ${
                    hasAvailableVideos(currentContent)
                      ? 'bg-white text-black hover:bg-blue-400'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <i className="ti ti-player-play mr-2 text-lg md:text-xl"></i>
                  Lecture
                </button>
                
                {/* Bouton Plus d'infos - Mobile icône, Desktop complet */}
                <button 
                  onClick={() => goToDetail(currentContent)}
                  className="w-12 md:flex-none bg-gray-500/30 backdrop-blur-sm text-gray-300 font-semibold h-10 md:h-auto md:w-auto md:px-8 py-2 md:py-3 rounded-md hover:bg-gray-500/40 transition-colors flex items-center justify-center drop-shadow-lg border border-gray-600/50"
                >
                  <i className="ti ti-info-circle text-lg md:text-xl"></i>
                  <span className="hidden md:inline ml-2">Plus d&apos;infos</span>
                </button>
                
                {/* Bouton Watchlist - Seulement si connecté */}
                {user && (
                  <button 
                    onClick={() => toggleWatchlist(currentContent.id, currentContent.type)}
                    className={`w-12 md:flex-none backdrop-blur-sm font-semibold h-10 md:h-auto md:w-auto md:px-4 py-2 md:py-3 rounded-md transition-colors flex items-center justify-center drop-shadow-lg border ${
                      watchlistStatus[`${currentContent.id}-${currentContent.type.toUpperCase()}`]
                        ? 'bg-blue-500/30 text-blue-300 border-blue-600/50 hover:bg-blue-500/40'
                        : 'bg-gray-500/30 text-gray-300 border-gray-600/50 hover:bg-gray-500/40'
                    }`}
                  >
                    <i className={`ti ti-bookmark text-lg md:text-xl ${
                      watchlistStatus[`${currentContent.id}-${currentContent.type.toUpperCase()}`]
                        ? 'ti-bookmark-filled'
                        : 'ti-bookmark'
                    }`}></i>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows - Masquées sur mobile */}
      {featuredContent.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="hidden md:block absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white w-12 h-12 rounded-full transition-colors flex items-center justify-center"
          >
            <i className="ti ti-chevron-left text-xl"></i>
          </button>
          <button
            onClick={nextSlide}
            className="hidden md:block absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white w-12 h-12 rounded-full transition-colors flex items-center justify-center"
          >
            <i className="ti ti-chevron-right text-xl"></i>
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {featuredContent.length > 1 && (
        <div className="absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2">
          {featuredContent.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-colors ${
                index === currentIndex ? 'bg-white' : 'bg-white/50'
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

    </section>
  );
}
