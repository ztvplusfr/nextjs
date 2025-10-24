'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Analytics } from "@vercel/analytics/next";
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MovieCard from '@/components/MovieCard';

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
}

interface Genre {
  id: number;
  name: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function MoviesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // États des filtres
  const [filters, setFilters] = useState({
    page: parseInt(searchParams.get('page') || '1'),
    genre: searchParams.get('genre') || '',
    year: searchParams.get('year') || '',
    minRating: searchParams.get('minRating') || '',
    sortBy: searchParams.get('sortBy') || 'releaseDate',
    sortOrder: searchParams.get('sortOrder') || 'desc',
    search: searchParams.get('search') || ''
  });

  // Générer les années (dernières 20 années)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - i);

  useEffect(() => {
    fetchGenres();
  }, []);

  useEffect(() => {
    fetchMovies();
  }, [filters]);

  const fetchGenres = async () => {
    try {
      const response = await fetch('/api/genres');
      const data = await response.json();
      if (data.success) {
        setGenres(data.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des genres:', error);
    }
  };

  const fetchMovies = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });

      console.log('Filtres envoyés:', filters);
      console.log('URL générée:', `/api/movies?${params.toString()}`);

      const response = await fetch(`/api/movies?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        console.log('Films reçus:', data.data.movies.length);
        setMovies(data.data.movies);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des films:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 };
    setFilters(updatedFilters);
    
    // Mettre à jour l'URL
    const params = new URLSearchParams();
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });
    
    router.push(`/movies?${params.toString()}`);
  };

  const goToPage = (page: number) => {
    const updatedFilters = { ...filters, page };
    setFilters(updatedFilters);
    
    const params = new URLSearchParams();
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });
    
    router.push(`/movies?${params.toString()}`);
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      genre: '',
      year: '',
      minRating: '',
      sortBy: 'releaseDate',
      sortOrder: 'desc',
      search: ''
    });
    router.push('/movies');
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Tous les films</h1>
          <p className="text-gray-400">
            {pagination ? `${pagination.totalCount} films disponibles` : 'Chargement...'}
          </p>
        </div>

        {/* Filtres */}
        <div className="bg-black/50 backdrop-blur-sm border border-sky-500/20 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Recherche */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Rechercher
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => updateFilters({ search: e.target.value })}
                placeholder="Titre du film..."
                className="w-full px-3 py-2 bg-black text-white rounded-md border border-sky-500/30 focus:border-sky-500 focus:outline-none"
              />
            </div>

            {/* Genre */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Genre
              </label>
              <select
                value={filters.genre}
                onChange={(e) => updateFilters({ genre: e.target.value })}
                className="w-full px-3 py-2 bg-black text-white rounded-md border border-sky-500/30 focus:border-sky-500 focus:outline-none"
              >
                <option value="">Tous les genres</option>
                {genres.map((genre) => (
                  <option key={genre.id} value={genre.name}>
                    {genre.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Année */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Année
              </label>
              <select
                value={filters.year}
                onChange={(e) => updateFilters({ year: e.target.value })}
                className="w-full px-3 py-2 bg-black text-white rounded-md border border-sky-500/30 focus:border-sky-500 focus:outline-none"
              >
                <option value="">Toutes les années</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Note minimale */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Note minimale
              </label>
              <select
                value={filters.minRating}
                onChange={(e) => updateFilters({ minRating: e.target.value })}
                className="w-full px-3 py-2 bg-black text-white rounded-md border border-sky-500/30 focus:border-sky-500 focus:outline-none"
              >
                <option value="">Toutes les notes</option>
                <option value="8">8+ ⭐</option>
                <option value="7">7+ ⭐</option>
                <option value="6">6+ ⭐</option>
                <option value="5">5+ ⭐</option>
              </select>
            </div>
          </div>

          {/* Tri et actions */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <label className="text-white text-sm font-medium">Trier par:</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => updateFilters({ sortBy: e.target.value })}
                  className="px-3 py-2 bg-black text-white rounded-md border border-sky-500/30 focus:border-sky-500 focus:outline-none"
                >
                  <option value="releaseDate">Date de sortie</option>
                  <option value="rating">Note</option>
                  <option value="title">Titre</option>
                </select>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <label className="text-white text-sm font-medium">Ordre:</label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => updateFilters({ sortOrder: e.target.value })}
                  className="px-3 py-2 bg-black text-white rounded-md border border-sky-500/30 focus:border-sky-500 focus:outline-none"
                >
                  <option value="desc">Décroissant</option>
                  <option value="asc">Croissant</option>
                </select>
              </div>
            </div>

            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-sky-500/20 text-sky-300 rounded-md hover:bg-sky-500/30 transition-colors border border-sky-500/30 w-full md:w-auto"
            >
              Effacer les filtres
            </button>
          </div>
        </div>

        {/* Grille de films */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 25 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-800 rounded-lg aspect-[2/3] mb-4"></div>
                <div className="h-4 bg-gray-800 rounded mb-2"></div>
                <div className="h-3 bg-gray-800 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : movies.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
              {movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => goToPage(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="px-4 py-2 bg-sky-500/20 text-sky-300 rounded-md hover:bg-sky-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-sky-500/30"
                >
                  Précédent
                </button>

                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, pagination.currentPage - 2) + i;
                    if (pageNum > pagination.totalPages) return null;
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`px-3 py-2 rounded-md transition-colors ${
                          pageNum === pagination.currentPage
                            ? 'bg-sky-500 text-white'
                            : 'bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/30'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => goToPage(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="px-4 py-2 bg-sky-500/20 text-sky-300 rounded-md hover:bg-sky-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-sky-500/30"
                >
                  Suivant
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-white mb-4">Aucun film trouvé</h2>
            <p className="text-gray-400 mb-6">
              Essayez de modifier vos critères de recherche
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-sky-500 text-white rounded-md hover:bg-sky-400 transition-colors"
            >
              Effacer les filtres
            </button>
          </div>
        )}
      </div>
      
      <Footer />
      <Analytics />
    </div>
  );
}
