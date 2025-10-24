'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface SimilarMovie {
  id: number;
  title: string;
  poster?: string;
  year?: number;
  rating?: number;
}

interface SimilarMoviesCarouselProps {
  movieId: string;
  maxItems?: number;
}

export default function SimilarMoviesCarousel({ movieId, maxItems }: SimilarMoviesCarouselProps) {
  const [movies, setMovies] = useState<SimilarMovie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSimilarMovies = async () => {
      try {
        const response = await fetch(`/api/movies/${movieId}/similar`);
        const data = await response.json();
        
        if (data.success) {
          const limitedMovies = maxItems ? data.data.slice(0, maxItems) : data.data;
          setMovies(limitedMovies);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des films similaires:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSimilarMovies();
  }, [movieId]);


  if (isLoading) {
    const loadingCount = maxItems || 6;
    return (
      <div className="relative">
        {maxItems ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: loadingCount }).map((_, index) => (
              <div key={index} className="w-full aspect-[2/3] bg-gray-800 rounded-lg animate-pulse">
                <div className="w-full h-full bg-gray-700 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex space-x-4 overflow-hidden">
            {Array.from({ length: loadingCount }).map((_, index) => (
              <div key={index} className="flex-shrink-0 w-48 aspect-[2/3] bg-gray-800 rounded-lg animate-pulse">
                <div className="w-full h-full bg-gray-700 rounded-lg"></div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">Aucun film similaire disponible</p>
      </div>
    );
  }

  // Si maxItems est défini, afficher en grille
  if (maxItems) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {movies.map((movie) => (
          <a
            key={movie.id}
            href={`/movies/${movie.id}`}
            className="w-full aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden hover:scale-105 transition-transform cursor-pointer group/movie block"
          >
            {movie.poster ? (
              <div className="relative w-full h-full">
                <Image
                  src={movie.poster.startsWith('http') 
                    ? movie.poster 
                    : `https://image.tmdb.org/t/p/w500${movie.poster}`
                  }
                  alt={movie.title}
                  fill
                  className="object-cover"
                />
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/movie:opacity-100 transition-opacity">
                  <button className="bg-sky-500 hover:bg-sky-400 text-white w-16 h-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110 flex items-center justify-center">
                    <i className="ti ti-player-play text-2xl"></i>
                  </button>
                </div>

                {/* Movie Info Overlay - Toujours visible */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                  <h3 className="font-semibold text-sm mb-2 line-clamp-2 text-white">{movie.title}</h3>
                  <div className="flex items-center justify-between text-xs text-gray-300">
                    {movie.year && <span className="flex items-center">
                      <i className="ti ti-calendar mr-1"></i>
                      {movie.year}
                    </span>}
                    {movie.rating && (
                      <span className="flex items-center bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full">
                        <i className="ti ti-star-filled text-yellow-400 mr-1"></i>
                        {movie.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                <div className="text-center p-4">
                  <i className="ti ti-movie text-4xl text-gray-500 mb-2"></i>
                  <p className="text-gray-400 text-sm line-clamp-2">{movie.title}</p>
                  {movie.year && (
                    <p className="text-gray-500 text-xs mt-2">{movie.year}</p>
                  )}
                </div>
              </div>
            )}
          </a>
        ))}
      </div>
    );
  }

  // Sinon, afficher en carousel (comportement par défaut)
  return (
    <div className="relative">
      {/* Movies Container */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex space-x-4 pb-4">
          {movies.map((movie) => (
            <a
              key={movie.id}
              href={`/movies/${movie.id}`}
              className="flex-shrink-0 w-48 aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden hover:scale-105 transition-transform cursor-pointer group/movie block"
            >
              {movie.poster ? (
                <div className="relative w-full h-full">
                  <Image
                    src={movie.poster.startsWith('http') 
                      ? movie.poster 
                      : `https://image.tmdb.org/t/p/w500${movie.poster}`
                    }
                    alt={movie.title}
                    fill
                    className="object-cover"
                  />
                  
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/movie:opacity-100 transition-opacity">
                    <button className="bg-sky-500 hover:bg-sky-400 text-white w-16 h-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110 flex items-center justify-center">
                      <i className="ti ti-player-play text-2xl"></i>
                    </button>
                  </div>

                  {/* Movie Info Overlay - Toujours visible */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                    <h3 className="font-semibold text-sm mb-2 line-clamp-2 text-white">{movie.title}</h3>
                    <div className="flex items-center justify-between text-xs text-gray-300">
                      {movie.year && <span className="flex items-center">
                        <i className="ti ti-calendar mr-1"></i>
                        {movie.year}
                      </span>}
                      {movie.rating && (
                        <span className="flex items-center bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full">
                          <i className="ti ti-star-filled text-yellow-400 mr-1"></i>
                          {movie.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                  <div className="text-center p-4">
                    <i className="ti ti-movie text-4xl text-gray-500 mb-2"></i>
                    <p className="text-gray-400 text-sm line-clamp-2">{movie.title}</p>
                    {movie.year && (
                      <p className="text-gray-500 text-xs mt-2">{movie.year}</p>
                    )}
                  </div>
                </div>
              )}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
