'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  avatar: string | null;
  role: string;
}

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
  isActive: boolean;
  isFeatured: boolean;
  genres: Array<{ id: number; name: string }>;
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
    }>;
  }>;
}

interface Genre {
  id: number;
  name: string;
}

export default function EditSeriesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [series, setSeries] = useState<Series | null>(null);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const router = useRouter();
  const params = useParams();
  const seriesId = params.id as string;

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    originalTitle: '',
    description: '',
    year: '',
    rating: '',
    poster: '',
    backdrop: '',
    trailer: '',
    firstAirDate: '',
    lastAirDate: '',
    numberOfSeasons: '',
    numberOfEpisodes: '',
    status: '',
    isActive: true,
    isFeatured: false,
    selectedGenres: [] as number[],
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user.role !== 'ADMIN') {
            router.push('/');
            return;
          }
          setUser(data.user);
        } else {
          router.push('/auth/login');
          return;
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/auth/login');
        return;
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        // Récupérer la série
        const seriesResponse = await fetch(`/api/admin/series/${seriesId}`, {
          credentials: 'include',
        });

        if (!seriesResponse.ok) {
          throw new Error('Série non trouvée');
        }

        const seriesData = await seriesResponse.json();
        setSeries(seriesData.data);

        // Remplir le formulaire
        setFormData({
          title: seriesData.data.title || '',
          originalTitle: seriesData.data.originalTitle || '',
          description: seriesData.data.description || '',
          year: seriesData.data.year?.toString() || '',
          rating: seriesData.data.rating?.toString() || '',
          poster: seriesData.data.poster || '',
          backdrop: seriesData.data.backdrop || '',
          trailer: seriesData.data.trailer || '',
          firstAirDate: seriesData.data.firstAirDate ? 
            new Date(seriesData.data.firstAirDate).toISOString().split('T')[0] : '',
          lastAirDate: seriesData.data.lastAirDate ? 
            new Date(seriesData.data.lastAirDate).toISOString().split('T')[0] : '',
          numberOfSeasons: seriesData.data.numberOfSeasons?.toString() || '',
          numberOfEpisodes: seriesData.data.numberOfEpisodes?.toString() || '',
          status: seriesData.data.status || '',
          isActive: seriesData.data.isActive,
          isFeatured: seriesData.data.isFeatured || false,
          selectedGenres: seriesData.data.genres ? seriesData.data.genres.map((g: any) => g.genre.id) : [],
        });

        // Récupérer les genres
        const genresResponse = await fetch('/api/admin/genres', { credentials: 'include' });

        if (genresResponse.ok) {
          const genresData = await genresResponse.json();
          setGenres(genresData.data || []);
        }

      } catch (error) {
        console.error('Erreur lors du chargement:', error);
        setError('Erreur lors du chargement des données');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, seriesId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleGenreChange = (genreId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedGenres: prev.selectedGenres.includes(genreId)
        ? prev.selectedGenres.filter(id => id !== genreId)
        : [...prev.selectedGenres, genreId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/series/${seriesId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          year: formData.year ? parseInt(formData.year) : null,
          rating: formData.rating ? Math.round(parseFloat(formData.rating) * 10) / 10 : null,
          numberOfSeasons: formData.numberOfSeasons ? parseInt(formData.numberOfSeasons) : null,
          numberOfEpisodes: formData.numberOfEpisodes ? parseInt(formData.numberOfEpisodes) : null,
          firstAirDate: formData.firstAirDate ? new Date(formData.firstAirDate).toISOString() : null,
          lastAirDate: formData.lastAirDate ? new Date(formData.lastAirDate).toISOString() : null,
          genres: formData.selectedGenres,
        }),
      });

      if (response.ok) {
        setSuccess('Série mise à jour avec succès !');
        setTimeout(() => {
          router.push('/admin?tab=series');
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setError('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Série non trouvée</h1>
            <p className="text-gray-400">La série que vous recherchez n'existe pas.</p>
            <button
              onClick={() => router.push('/admin?tab=series')}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Retour à l'administration
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Modifier la série</h1>
            <p className="text-gray-400">{series.title}</p>
          </div>
          <button
            onClick={() => router.push('/admin?tab=series')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors flex items-center"
          >
            <i className="ti ti-arrow-left mr-2"></i>
            Retour
          </button>
        </div>

        {/* Messages d'erreur et de succès */}
        {error && (
          <div className="bg-red-900/20 border border-red-700 text-red-400 px-4 py-3 rounded-md mb-6">
            <i className="ti ti-alert-circle mr-2"></i>
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-900/20 border border-green-700 text-green-400 px-4 py-3 rounded-md mb-6">
            <i className="ti ti-check-circle mr-2"></i>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Informations de base */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Informations de base</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Titre *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Titre original
                </label>
                <input
                  type="text"
                  name="originalTitle"
                  value={formData.originalTitle}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Année
                </label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  min="1900"
                  max="2030"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Note (sur 10)
                </label>
                <input
                  type="number"
                  name="rating"
                  value={formData.rating}
                  onChange={handleInputChange}
                  min="0"
                  max="10"
                  step="0.1"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Nombre de saisons
                </label>
                <input
                  type="number"
                  name="numberOfSeasons"
                  value={formData.numberOfSeasons}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Nombre d'épisodes
                </label>
                <input
                  type="number"
                  name="numberOfEpisodes"
                  value={formData.numberOfEpisodes}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Statut
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner un statut</option>
                  <option value="Returning Series">Série en cours</option>
                  <option value="Ended">Terminée</option>
                  <option value="Canceled">Annulée</option>
                  <option value="Planned">Prévue</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Dates de diffusion */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Dates de diffusion</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Première diffusion
                </label>
                <input
                  type="date"
                  name="firstAirDate"
                  value={formData.firstAirDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Dernière diffusion
                </label>
                <input
                  type="date"
                  name="lastAirDate"
                  value={formData.lastAirDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Images et médias */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Images et médias</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  URL du poster
                </label>
                <input
                  type="url"
                  name="poster"
                  value={formData.poster}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                />
                
                {/* Aperçu du poster */}
                {formData.poster && (
                  <div className="mt-4">
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Aperçu du poster
                    </label>
                    <div className="relative w-full max-w-xs">
                      <img
                        src={formData.poster}
                        alt="Aperçu du poster"
                        className="w-full h-64 object-cover rounded-lg border border-gray-600"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden w-full h-64 bg-gray-800 border border-gray-600 rounded-lg flex items-center justify-center">
                        <div className="text-center text-gray-400">
                          <i className="ti ti-photo text-4xl mb-2"></i>
                          <p>Image non trouvée</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  URL de l'image de fond
                </label>
                <input
                  type="url"
                  name="backdrop"
                  value={formData.backdrop}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                />
                
                {/* Aperçu du backdrop */}
                {formData.backdrop && (
                  <div className="mt-4">
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Aperçu de l'image de fond
                    </label>
                    <div className="relative w-full max-w-md">
                      <img
                        src={formData.backdrop}
                        alt="Aperçu de l'image de fond"
                        className="w-full h-32 object-cover rounded-lg border border-gray-600"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden w-full h-32 bg-gray-800 border border-gray-600 rounded-lg flex items-center justify-center">
                        <div className="text-center text-gray-400">
                          <i className="ti ti-photo text-4xl mb-2"></i>
                          <p>Image non trouvée</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  URL de la bande-annonce
                </label>
                <input
                  type="url"
                  name="trailer"
                  value={formData.trailer}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Genres */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Genres</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {genres.map((genre) => (
                <label key={genre.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.selectedGenres.includes(genre.id)}
                    onChange={() => handleGenreChange(genre.id)}
                    className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-300">{genre.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Options</h2>
            
            <div className="space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                />
                <span className="text-gray-300">Série active</span>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                />
                <span className="text-gray-300">Série vedette</span>
              </label>
            </div>
          </div>

          {/* Saisons et Épisodes */}
          {series.seasons && series.seasons.length > 0 && (
            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Saisons et Épisodes</h2>
              
              <div className="space-y-6">
                {series.seasons.map((season) => (
                  <div key={season.id} className="border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-1 h-6 bg-blue-500 rounded-full mr-3"></div>
                        <h3 className="text-lg font-semibold text-white">
                          Saison {season.number}
                          {season.title && ` - ${season.title}`}
                        </h3>
                        <span className="ml-3 text-gray-400 text-sm">
                          ({season.episodeCount} épisode{season.episodeCount > 1 ? 's' : ''})
                        </span>
                      </div>
                      <button
                        onClick={() => router.push(`/admin/series/${params.id}/season/${season.id}/edit`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors flex items-center"
                      >
                        <i className="ti ti-edit mr-1"></i>
                        Modifier
                      </button>
                    </div>
                    
                    {season.episodes && season.episodes.length > 0 && (
                      <div className="ml-4">
                        <h4 className="text-gray-300 text-sm font-medium mb-3">Épisodes</h4>
                        
                        <div className="space-y-2">
                          {season.episodes.map((episode) => (
                            <div key={episode.id} className="bg-gray-800 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h5 className="text-white font-medium text-sm">
                                    Épisode {episode.number} - {episode.title}
                                  </h5>
                                  <div className="flex items-center space-x-3 text-xs text-gray-400 mt-1">
                                    {episode.duration && (
                                      <span>
                                        {episode.duration >= 60 
                                          ? `${Math.floor(episode.duration / 60)}h ${episode.duration % 60}min`
                                          : `${episode.duration}min`
                                        }
                                      </span>
                                    )}
                                    {episode.airDate && (
                                      <span>
                                        {new Date(episode.airDate).toLocaleDateString('fr-FR')}
                                      </span>
                                    )}
                                    {episode.rating && (
                                      <span className="flex items-center">
                                        <i className="ti ti-star-filled text-yellow-400 mr-1"></i>
                                        {episode.rating.toFixed(1)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={() => router.push(`/admin/series/${params.id}/episode/${episode.id}/edit`)}
                                  className="ml-3 bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs transition-colors flex items-center"
                                >
                                  <i className="ti ti-edit mr-1"></i>
                                  Modifier
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/admin?tab=series')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md transition-colors"
            >
              Annuler
            </button>
            
            <button
              type="submit"
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-6 py-2 rounded-md transition-colors flex items-center"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sauvegarde...
                </>
              ) : (
                <>
                  <i className="ti ti-check mr-2"></i>
                  Sauvegarder
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
