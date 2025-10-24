'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';

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
  isActive: boolean;
  isFeatured: boolean;
  genres: Array<{ id: number; name: string }>;
}

interface Genre {
  id: number;
  name: string;
}

interface Video {
  id: number;
  title: string;
  embedUrl: string;
  quality?: string;
  language: string;
  type: string;
}


export default function EditMoviePage() {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  
  const router = useRouter();
  const params = useParams();
  const movieId = params.id as string;

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    originalTitle: '',
    description: '',
    year: '',
    rating: '',
    duration: '',
    poster: '',
    backdrop: '',
    trailer: '',
    releaseDate: '',
    isActive: true,
    isFeatured: false,
    selectedGenres: [] as number[],
  });

  // Video form data
  const [videoFormData, setVideoFormData] = useState({
    title: '',
    embedUrl: '',
    quality: '',
    language: 'FR',
    type: 'MOVIE',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer le film
        const movieResponse = await fetch(`/api/admin/movies/${movieId}`, {
          credentials: 'include',
        });

        if (!movieResponse.ok) {
          throw new Error('Film non trouvé');
        }

        const movieData = await movieResponse.json();
        setMovie(movieData.data);

        // Remplir le formulaire
        setFormData({
          title: movieData.data.title || '',
          originalTitle: movieData.data.originalTitle || '',
          description: movieData.data.description || '',
          year: movieData.data.year?.toString() || '',
          rating: movieData.data.rating?.toString() || '',
          duration: movieData.data.duration?.toString() || '',
          poster: movieData.data.poster || '',
          backdrop: movieData.data.backdrop || '',
          trailer: movieData.data.trailer || '',
          releaseDate: movieData.data.releaseDate ? 
            new Date(movieData.data.releaseDate).toISOString().split('T')[0] : '',
          isActive: movieData.data.isActive,
          isFeatured: movieData.data.isFeatured || false,
          selectedGenres: movieData.data.genres ? movieData.data.genres.map((g: any) => g.genre.id) : [],
        });

        // Récupérer les genres
        const genresResponse = await fetch('/api/admin/genres', { credentials: 'include' });

        if (genresResponse.ok) {
          const genresData = await genresResponse.json();
          setGenres(genresData.data || []);
        }

        // Récupérer les vidéos du film
        const videosResponse = await fetch(`/api/admin/movies/${movieId}/videos`, { credentials: 'include' });

        if (videosResponse.ok) {
          const videosData = await videosResponse.json();
          setVideos(videosData.data || []);
        }

      } catch (error) {
        console.error('Erreur lors du chargement:', error);
        setError('Erreur lors du chargement des données');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [movieId]);

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

  const handleVideoInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setVideoFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetVideoForm = () => {
    setVideoFormData({
      title: '',
      embedUrl: '',
      quality: '',
      language: 'FR',
      type: 'MOVIE',
    });
    setEditingVideo(null);
    setShowVideoForm(false);
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/movies/${movieId}/videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(videoFormData),
      });

      if (response.ok) {
        const result = await response.json();
        setVideos(prev => [...prev, result.data]);
        setSuccess('Vidéo ajoutée avec succès !');
        resetVideoForm();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erreur lors de l\'ajout de la vidéo');
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la vidéo:', error);
      setError('Erreur lors de l\'ajout de la vidéo');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditVideo = (video: Video) => {
    setEditingVideo(video);
    setVideoFormData({
      title: video.title,
      embedUrl: video.embedUrl,
      quality: video.quality || '',
      language: video.language,
      type: video.type,
    });
    setShowVideoForm(true);
  };

  const handleUpdateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideo) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/movies/${movieId}/videos/${editingVideo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(videoFormData),
      });

      if (response.ok) {
        const result = await response.json();
        setVideos(prev => prev.map(v => v.id === editingVideo.id ? result.data : v));
        setSuccess('Vidéo modifiée avec succès !');
        resetVideoForm();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erreur lors de la modification de la vidéo');
      }
    } catch (error) {
      console.error('Erreur lors de la modification de la vidéo:', error);
      setError('Erreur lors de la modification de la vidéo');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteVideo = async (videoId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette vidéo ?')) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/movies/${movieId}/videos/${videoId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setVideos(prev => prev.filter(v => v.id !== videoId));
        setSuccess('Vidéo supprimée avec succès !');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erreur lors de la suppression de la vidéo');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la vidéo:', error);
      setError('Erreur lors de la suppression de la vidéo');
    } finally {
      setIsSaving(false);
    }
  };


  // Fonction pour normaliser l'URL du trailer
  const normalizeTrailerUrl = (trailer: string): string => {
    if (!trailer) return '';
    
    // Si c'est déjà une URL complète YouTube
    if (trailer.includes('youtube.com') || trailer.includes('youtu.be')) {
      return trailer;
    }
    
    // Si c'est juste un ID YouTube, on construit l'URL complète
    if (trailer.length > 0 && !trailer.includes('http')) {
      return `https://www.youtube.com/watch?v=${trailer}`;
    }
    
    return trailer;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/movies/${movieId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          trailer: normalizeTrailerUrl(formData.trailer),
          year: formData.year ? parseInt(formData.year) : null,
          rating: formData.rating ? Math.round(parseFloat(formData.rating) * 10) / 10 : null,
          duration: formData.duration ? parseInt(formData.duration) : null,
          genres: formData.selectedGenres,
        }),
      });

      if (response.ok) {
        setSuccess('Film mis à jour avec succès !');
        setTimeout(() => {
          router.push('/admin?tab=movies');
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

  if (!movie) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Film non trouvé</h1>
            <p className="text-gray-400">Le film que vous recherchez n'existe pas.</p>
            <button
              onClick={() => router.push('/admin?tab=movies')}
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
            <h1 className="text-3xl font-bold text-white mb-2">Modifier le film</h1>
            <p className="text-gray-400">{movie.title}</p>
          </div>
          <button
            onClick={() => router.push('/admin?tab=movies')}
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

        {/* Section Vidéos - En dehors du formulaire principal */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Vidéos</h2>
            <button
              type="button"
              onClick={() => {
                resetVideoForm();
                setShowVideoForm(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors flex items-center"
            >
              <i className="ti ti-plus mr-2"></i>
              Ajouter une vidéo
            </button>
          </div>

          {/* Formulaire d'ajout/modification de vidéo */}
          {showVideoForm && (
            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">
                  {editingVideo ? 'Modifier la vidéo' : 'Ajouter une vidéo'}
                </h3>
                <button
                  type="button"
                  onClick={resetVideoForm}
                  className="text-gray-400 hover:text-white"
                >
                  <i className="ti ti-x text-xl"></i>
                </button>
              </div>

              <form onSubmit={editingVideo ? handleUpdateVideo : handleAddVideo} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Titre de la vidéo *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={videoFormData.title}
                      onChange={handleVideoInputChange}
                      required
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      URL d'embed *
                    </label>
                    <input
                      type="url"
                      name="embedUrl"
                      value={videoFormData.embedUrl}
                      onChange={handleVideoInputChange}
                      required
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Qualité
                    </label>
                    <select
                      name="quality"
                      value={videoFormData.quality}
                      onChange={handleVideoInputChange}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sélectionner une qualité</option>
                      <option value="360p">360p</option>
                      <option value="480p">480p</option>
                      <option value="720p">720p</option>
                      <option value="1080p">1080p</option>
                      <option value="4K">4K</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Langue *
                    </label>
                    <select
                      name="language"
                      value={videoFormData.language}
                      onChange={handleVideoInputChange}
                      required
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="FR">Français</option>
                      <option value="EN">Anglais</option>
                      <option value="ES">Espagnol</option>
                      <option value="DE">Allemand</option>
                      <option value="IT">Italien</option>
                      <option value="VOSTFR">VOSTFR</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Type *
                    </label>
                    <select
                      name="type"
                      value={videoFormData.type}
                      onChange={handleVideoInputChange}
                      required
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="MOVIE">Film</option>
                      <option value="EPISODE">Épisode</option>
                      <option value="TRAILER">Bande-annonce</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={resetVideoForm}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors flex items-center"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {editingVideo ? 'Modification...' : 'Ajout...'}
                      </>
                    ) : (
                      <>
                        <i className="ti ti-check mr-2"></i>
                        {editingVideo ? 'Modifier' : 'Ajouter'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Liste des vidéos existantes */}
          <div className="space-y-3">
            {videos.length > 0 ? (
              videos.map((video) => (
                <div key={video.id} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-white font-medium mb-2">{video.title}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
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
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditVideo(video)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        <i className="ti ti-edit mr-1"></i>
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDeleteVideo(video.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        <i className="ti ti-trash mr-1"></i>
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <i className="ti ti-video text-gray-400 text-4xl mb-4"></i>
                <p className="text-gray-400">Aucune vidéo ajoutée pour ce film</p>
              </div>
            )}
          </div>
        </div>

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
                  Durée (en minutes)
                </label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Date de sortie
                </label>
                <input
                  type="date"
                  name="releaseDate"
                  value={formData.releaseDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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

          {/* Images et médias */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Images et médias</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  URL de l'affiche
                </label>
                <input
                  type="url"
                  name="poster"
                  value={formData.poster}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {formData.poster && (
                  <div className="mt-2">
                    <img
                      src={formData.poster}
                      alt="Aperçu de l'affiche"
                      className="w-24 h-36 object-cover rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
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
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {formData.backdrop && (
                  <div className="mt-2">
                    <img
                      src={formData.backdrop}
                      alt="Aperçu de l'image de fond"
                      className="w-32 h-18 object-cover rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-6">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Bande-annonce (URL YouTube ou ID)
              </label>
              <input
                type="text"
                name="trailer"
                value={formData.trailer}
                onChange={handleInputChange}
                placeholder="https://www.youtube.com/watch?v=VIDEO_ID ou VIDEO_ID"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-gray-400 text-sm mt-1">
                Vous pouvez saisir soit l'URL complète YouTube, soit juste l'ID de la vidéo (ex: FgdS-IaFMQE)
              </p>
              {formData.trailer && (
                <div className="mt-2">
                  <p className="text-gray-400 text-sm mb-2">Aperçu :</p>
                  <div className="bg-gray-800 rounded p-3">
                    {formData.trailer.includes('youtube.com') || formData.trailer.includes('youtu.be') ? (
                      <p className="text-green-400 text-sm">
                        <i className="ti ti-check mr-1"></i>
                        URL YouTube valide
                      </p>
                    ) : formData.trailer.length > 0 ? (
                      <div>
                        <p className="text-blue-400 text-sm mb-2">
                          <i className="ti ti-info-circle mr-1"></i>
                          ID YouTube détecté
                        </p>
                        <p className="text-gray-300 text-sm">
                          URL générée : <span className="text-blue-400">https://www.youtube.com/watch?v={formData.trailer}</span>
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Genres */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Genres</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Genres actuels
                </label>
                <div className="flex flex-wrap gap-2">
                  {movie.genres && movie.genres.length > 0 ? (
                    movie.genres.map((movieGenre: any) => (
                      <span
                        key={movieGenre.genre.id}
                        className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm"
                      >
                        {movieGenre.genre.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400">Aucun genre assigné</span>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Modifier les genres
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {genres.map((genre) => (
                    <label key={genre.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.selectedGenres.includes(genre.id)}
                        onChange={() => handleGenreChange(genre.id)}
                        className="mr-2"
                      />
                      <span className="text-white">{genre.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Statut */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Statut</h2>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <label className="text-white">Film actif (visible sur le site)</label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <label className="text-white">Film en vedette (affiché dans le slider principal)</label>
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push('/admin?tab=movies')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-md transition-colors"
            >
              Annuler
            </button>
            
            <button
              type="submit"
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-md transition-colors flex items-center"
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
