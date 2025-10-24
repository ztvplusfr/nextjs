'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface SimilarSeries {
  id: number;
  title: string;
  poster?: string;
  year?: number;
  rating?: number;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
}

interface SimilarSeriesCarouselProps {
  seriesId: string;
}

export default function SimilarSeriesCarousel({ seriesId }: SimilarSeriesCarouselProps) {
  const [series, setSeries] = useState<SimilarSeries[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchSimilarSeries = async () => {
      try {
        const response = await fetch(`/api/series/${seriesId}/similar`);
        const data = await response.json();
        
        if (data.success) {
          setSeries(data.data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des séries similaires:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSimilarSeries();
  }, [seriesId]);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex >= series.length - 6 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex <= 0 ? Math.max(0, series.length - 6) : prevIndex - 1
    );
  };

  if (isLoading) {
    return (
      <div className="relative">
        <div className="flex space-x-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex-shrink-0 w-48 h-72 bg-gray-800 rounded-lg animate-pulse">
              <div className="w-full h-full bg-gray-700 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (series.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">Aucune série similaire disponible</p>
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-black/70 hover:bg-black/90 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <i className="ti ti-chevron-left text-xl"></i>
      </button>
      
      <button
        onClick={nextSlide}
        className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-black/70 hover:bg-black/90 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <i className="ti ti-chevron-right text-xl"></i>
      </button>

      {/* Series Container */}
      <div className="overflow-hidden">
        <div 
          className="flex space-x-4 transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 208}px)` }}
        >
          {series.map((serie) => (
            <a
              key={serie.id}
              href={`/series/${serie.id}`}
              className="flex-shrink-0 w-48 h-72 bg-gray-800 rounded-lg overflow-hidden hover:scale-105 transition-transform cursor-pointer group/series block"
            >
              {serie.poster ? (
                <div className="relative w-full h-full">
                  <Image
                    src={serie.poster.startsWith('http') 
                      ? serie.poster 
                      : `https://image.tmdb.org/t/p/w500${serie.poster}`
                    }
                    alt={serie.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/series:opacity-100 transition-opacity" />
                  
                  {/* Series Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 group-hover/series:opacity-100 transition-opacity">
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2">{serie.title}</h3>
                    <div className="flex items-center space-x-2 text-xs text-gray-300">
                      {serie.year && <span>{serie.year}</span>}
                      {serie.rating && (
                        <span className="flex items-center">
                          <i className="ti ti-star-filled text-yellow-400 mr-1"></i>
                          {serie.rating.toFixed(1)}
                        </span>
                      )}
                      {serie.numberOfSeasons && (
                        <span>{serie.numberOfSeasons} saison{serie.numberOfSeasons > 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                  <div className="text-center">
                    <i className="ti ti-device-tv text-4xl text-gray-500 mb-2"></i>
                    <p className="text-gray-400 text-sm">{serie.title}</p>
                  </div>
                </div>
              )}
            </a>
          ))}
        </div>
      </div>

      {/* Dots Indicator */}
      {series.length > 6 && (
        <div className="flex justify-center mt-4 space-x-2">
          {Array.from({ length: Math.ceil(series.length / 6) }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index * 6)}
              className={`w-2 h-2 rounded-full transition-colors ${
                Math.floor(currentIndex / 6) === index ? 'bg-white' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
