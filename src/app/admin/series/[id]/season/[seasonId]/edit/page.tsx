'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';

interface Season {
  id: number;
  number: number;
  title?: string;
  description?: string;
  poster?: string;
  airDate?: string;
  episodeCount: number;
  series: {
    id: number;
    title: string;
  };
}

export default function EditSeasonPage() {
  const [season, setSeason] = useState<Season | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const router = useRouter();
  const params = useParams();
  const seriesId = params.id as string;
  const seasonId = params.seasonId as string;

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    poster: '',
    airDate: '',
  });

  useEffect(() => {
    const fetchSeason = async () => {
      try {
        const response = await fetch(`/api/admin/series/${seriesId}/seasons/${seasonId}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Saison non trouvée');
        }

        const data = await response.json();
        setSeason(data.data);

        // Remplir le formulaire
        setFormData({
          title: data.data.title || '',
          description: data.data.description || '',
          poster: data.data.poster || '',
          airDate: data.data.airDate ? 
            new Date(data.data.airDate).toISOString().split('T')[0] : '',
        });

      } catch (error) {
        console.error('Erreur lors du chargement:', error);
        setError('Erreur lors du chargement de la saison');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSeason();
  }, [seriesId, seasonId]);

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
      const response = await fetch(`/api/admin/series/${seriesId}/seasons/${seasonId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          airDate: formData.airDate ? new Date(formData.airDate).toISOString() : null,
        }),
      });

      if (response.ok) {
        setSuccess('Saison mise à jour avec succès !');
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

  if (isLoading) {
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

  if (!season) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Saison non trouvée</h1>
            <p className="text-gray-400">La saison que vous recherchez n'existe pas.</p>
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
            <h1 className="text-3xl font-bold text-white mb-2">Modifier la saison</h1>
            <p className="text-gray-400">
              {season.series.title} - Saison {season.number}
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
            <h2 className="text-xl font-semibold text-white mb-6">Informations de la saison</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Titre de la saison
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Saison 1, Première saison..."
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
                  placeholder="Description de la saison..."
                />
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
                URL du poster de la saison
              </label>
              <input
                type="url"
                name="poster"
                value={formData.poster}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                placeholder="https://image.tmdb.org/t/p/w500/..."
              />
              
              {/* Aperçu de l'image */}
              {formData.poster && (
                <div className="mt-4">
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Aperçu
                  </label>
                  <div className="relative w-full max-w-md">
                    <img
                      src={formData.poster}
                      alt="Aperçu de la saison"
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
