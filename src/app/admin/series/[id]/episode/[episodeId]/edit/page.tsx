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
    };
  };
  videos: Array<{
    id: number;
    title: string;
    embedUrl: string;
    quality?: string;
    language?: string;
    type: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
}

export default function EditEpisodePage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const router = useRouter();
  const params = useParams();
  const seriesId = params.id as string;
  const episodeId = params.episodeId as string;

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: '',
    airDate: '',
    rating: '',
    stillPath: '',
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

    const fetchEpisode = async () => {
      try {
        console.log(`Fetching episode: /api/admin/series/${seriesId}/episodes/${episodeId}`);
        const response = await fetch(`/api/admin/series/${seriesId}/episodes/${episodeId}`, {
          credentials: 'include',
        });

        console.log('Response status:', response.status);
        if (!response.ok) {
          const errorData = await response.json();
          console.error('API Error:', errorData);
          setError('Épisode non trouvé');
          return;
        }

        const data = await response.json();
        console.log('Episode data:', data);
        
        if (!data.success) {
          console.error('API returned success: false', data);
          setError(data.error || 'Erreur lors du chargement de l\'épisode');
          return;
        }

        setEpisode(data.data);

        // Remplir le formulaire
        setFormData({
          title: data.data.title || '',
          description: data.data.description || '',
          duration: data.data.duration?.toString() || '',
          airDate: data.data.airDate ? 
            new Date(data.data.airDate).toISOString().split('T')[0] : '',
          rating: data.data.rating?.toString() || '',
          stillPath: data.data.stillPath || '',
        });

      } catch (error) {
        console.error('Erreur lors du chargement:', error);
        setError('Erreur lors du chargement de l\'épisode');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEpisode();
  }, [user, seriesId, episodeId]);

  // Fonction pour rafraîchir les vidéos (appelée après ajout/suppression)
  const refreshVideos = async () => {
    try {
      const response = await fetch(`/api/admin/series/${seriesId}/episodes/${episodeId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setEpisode(data.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des vidéos:', error);
    }
  };

  // Fonction pour supprimer une vidéo
  const deleteVideo = async (videoId: number) => {
    try {
      const response = await fetch(`/api/admin/series/${seriesId}/episodes/${episodeId}/videos/${videoId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        refreshVideos(); // Rafraîchir la liste des vidéos
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setError('Erreur lors de la suppression');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/series/${seriesId}/episodes/${episodeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          duration: formData.duration ? parseInt(formData.duration) : null,
          rating: formData.rating ? parseFloat(formData.rating) : null,
          airDate: formData.airDate ? new Date(formData.airDate).toISOString() : null,
        }),
      });

      if (response.ok) {
        setSuccess('Épisode mis à jour avec succès !');
        setTimeout(() => {
          router.push(`/admin/series/${seriesId}/edit`);
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

  if (!episode && !isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Épisode non trouvé</h1>
            <p className="text-gray-400">L'épisode que vous recherchez n'existe pas.</p>
            {error && (
              <div className="bg-red-900/20 border border-red-700 text-red-400 px-4 py-3 rounded-md mb-4 mt-4">
                <i className="ti ti-alert-circle mr-2"></i>
                {error}
              </div>
            )}
            <button
              onClick={() => router.push(`/admin/series/${seriesId}/edit`)}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Retour à la série
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
            <h1 className="text-3xl font-bold text-white mb-2">Modifier l'épisode</h1>
            <p className="text-gray-400">
              {episode ? `${episode.season.series.title} - Saison ${episode.season.number} - Épisode ${episode.number}` : 'Chargement...'}
            </p>
          </div>
          <button
            onClick={() => router.push(`/admin/series/${seriesId}/edit`)}
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
            <h2 className="text-xl font-semibold text-white mb-6">Informations de l'épisode</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Titre de l'épisode *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Titre de l'épisode..."
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Description de l'épisode..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Durée (en minutes)
                  </label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="60"
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
                    placeholder="8.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Date de diffusion
                </label>
                <input
                  type="date"
                  name="airDate"
                  value={formData.airDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Images</h2>
            
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                URL de l'image de l'épisode
              </label>
              <input
                type="url"
                name="stillPath"
                value={formData.stillPath}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                placeholder="https://image.tmdb.org/t/p/w500/..."
              />
              
              {/* Aperçu de l'image */}
              {formData.stillPath && (
                <div className="mt-4">
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Aperçu
                  </label>
                  <div className="relative w-full max-w-md">
                    <img
                      src={formData.stillPath}
                      alt="Aperçu de l'épisode"
                      className="w-full h-48 object-cover rounded-lg border border-gray-600"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden w-full h-48 bg-gray-800 border border-gray-600 rounded-lg flex items-center justify-center">
                      <div className="text-center text-gray-400">
                        <i className="ti ti-photo text-4xl mb-2"></i>
                        <p>Image non trouvée</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Vidéos */}
          <div className="bg-gray-900 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Vidéos</h2>
              <button
                type="button"
                onClick={() => router.push(`/admin/series/${seriesId}/episode/${episodeId}/video/add`)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors flex items-center"
              >
                <i className="ti ti-plus mr-2"></i>
                Ajouter une vidéo
              </button>
            </div>
            
            {episode && episode.videos && episode.videos.length > 0 ? (
              <div className="space-y-4">
                {episode.videos.map((video) => (
                  <div key={video.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-white font-medium">{video.title}</h3>
                          <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
                            {video.type}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
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
                            <i className="ti ti-calendar mr-1"></i>
                            {new Date(video.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <div className="mt-2">
                          <span className="text-gray-500 text-sm">URL: {video.embedUrl}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => router.push(`/admin/series/${seriesId}/episode/${episodeId}/video/${video.id}/edit`)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors flex items-center"
                        >
                          <i className="ti ti-edit mr-1"></i>
                          Modifier
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Êtes-vous sûr de vouloir supprimer cette vidéo ?')) {
                              deleteVideo(video.id);
                            }
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors flex items-center"
                        >
                          <i className="ti ti-trash mr-1"></i>
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <i className="ti ti-video text-4xl text-gray-500 mb-4"></i>
                <p className="text-gray-400 mb-4">Aucune vidéo disponible pour cet épisode</p>
                <button
                  onClick={() => router.push(`/admin/series/${seriesId}/episode/${episodeId}/video/add`)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors flex items-center mx-auto"
                >
                  <i className="ti ti-plus mr-2"></i>
                  Ajouter la première vidéo
                </button>
              </div>
            )}
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push(`/admin/series/${seriesId}/edit`)}
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
