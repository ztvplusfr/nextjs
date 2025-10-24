'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';

interface Episode {
  id: number;
  number: number;
  title: string;
  season: {
    id: number;
    number: number;
    series: {
      id: number;
      title: string;
    };
  };
}

export default function AddVideoPage() {
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
    embedUrl: '',
    quality: '',
    language: 'fr',
    type: 'EPISODE',
  });

  useEffect(() => {
    const fetchEpisode = async () => {
      try {
        const response = await fetch(`/api/admin/series/${seriesId}/episodes/${episodeId}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Épisode non trouvé');
        }

        const data = await response.json();
        setEpisode(data.data);

      } catch (error) {
        console.error('Erreur lors du chargement:', error);
        setError('Erreur lors du chargement de l\'épisode');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEpisode();
  }, [seriesId, episodeId]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/series/${seriesId}/episodes/${episodeId}/videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
        }),
      });

      if (response.ok) {
        setSuccess('Vidéo ajoutée avec succès !');
        setTimeout(() => {
          router.push(`/admin/series/${seriesId}/episode/${episodeId}/edit`);
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erreur lors de l\'ajout');
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

  if (!episode) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Épisode non trouvé</h1>
            <p className="text-gray-400">L'épisode que vous recherchez n'existe pas.</p>
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
            <h1 className="text-3xl font-bold text-white mb-2">Ajouter une vidéo</h1>
            <p className="text-gray-400">
              {episode.season.series.title} - Saison {episode.season.number} - Épisode {episode.number}
            </p>
          </div>
          <button
            onClick={() => router.push(`/admin/series/${seriesId}/episode/${episodeId}/edit`)}
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
            <h2 className="text-xl font-semibold text-white mb-6">Informations de la vidéo</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Titre de la vidéo *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Bande-annonce officielle, Teaser, Making of..."
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  URL d'intégration *
                </label>
                <input
                  type="url"
                  name="embedUrl"
                  value={formData.embedUrl}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: https://www.youtube.com/embed/dQw4w9WgXcQ"
                />
                <p className="text-gray-400 text-sm mt-1">
                  URL d'intégration de la vidéo (YouTube embed, Vimeo, etc.)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Qualité
                  </label>
                  <select
                    name="quality"
                    value={formData.quality}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner une qualité</option>
                    <option value="480p">480p</option>
                    <option value="720p">720p</option>
                    <option value="1080p">1080p</option>
                    <option value="4K">4K</option>
                    <option value="8K">8K</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Langue
                  </label>
                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="fr">Français</option>
                    <option value="en">Anglais</option>
                    <option value="es">Espagnol</option>
                    <option value="de">Allemand</option>
                    <option value="it">Italien</option>
                    <option value="pt">Portugais</option>
                    <option value="ru">Russe</option>
                    <option value="ja">Japonais</option>
                    <option value="ko">Coréen</option>
                    <option value="zh">Chinois</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Type de vidéo
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="EPISODE">Épisode</option>
                  <option value="TRAILER">Bande-annonce</option>
                  <option value="MOVIE">Film</option>
                </select>
                <p className="text-gray-400 text-sm mt-1">
                  Type de contenu vidéo (pour les épisodes, sélectionnez "Épisode")
                </p>
              </div>
            </div>
          </div>

          {/* Aperçu de la vidéo */}
          {formData.embedUrl && (
            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Aperçu de la vidéo</h2>
              
              <div className="relative w-full max-w-2xl">
                <iframe
                  width="100%"
                  height="315"
                  src={formData.embedUrl}
                  title={formData.title || 'Aperçu vidéo'}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="rounded-lg"
                ></iframe>
              </div>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push(`/admin/series/${seriesId}/episode/${episodeId}/edit`)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md transition-colors"
            >
              Annuler
            </button>
            
            <button
              type="submit"
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white px-6 py-2 rounded-md transition-colors flex items-center"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Ajout...
                </>
              ) : (
                <>
                  <i className="ti ti-plus mr-2"></i>
                  Ajouter la vidéo
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
