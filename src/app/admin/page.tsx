'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Analytics } from "@vercel/analytics/next";
import Header from '@/components/Header';

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  avatar: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  _count?: {
    sessions: number;
  };
}

interface Stats {
  totalUsers: number;
  totalMovies: number;
  totalSeries: number;
  totalSeasons: number;
  totalEpisodes: number;
  totalVideos: number;
  totalGenres: number;
  totalCategories: number;
  activeUsers: number;
}

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersRole, setUsersRole] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // TMDB state
  const [tmdbSearchQuery, setTmdbSearchQuery] = useState('');
  const [tmdbSearchType, setTmdbSearchType] = useState('movie');
  const [tmdbSearchResults, setTmdbSearchResults] = useState<any[]>([]);
  const [tmdbSearchLoading, setTmdbSearchLoading] = useState(false);
  const [tmdbImportLoading, setTmdbImportLoading] = useState(false);
  
  // Movies state
  const [movies, setMovies] = useState<any[]>([]);
  const [moviesLoading, setMoviesLoading] = useState(false);
  const [moviesPage, setMoviesPage] = useState(1);
  const [moviesTotal, setMoviesTotal] = useState(0);
  const [moviesSearch, setMoviesSearch] = useState('');
  
  // Series state
  const [series, setSeries] = useState<any[]>([]);
  const [seriesLoading, setSeriesLoading] = useState(false);
  const [seriesPage, setSeriesPage] = useState(1);
  const [seriesTotal, setSeriesTotal] = useState(0);
  const [seriesSearch, setSeriesSearch] = useState('');
  
  const router = useRouter();

  useEffect(() => {
    const fetchAdminData = async () => {
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
          
          // Charger les statistiques
          const statsResponse = await fetch('/api/admin/stats', {
            credentials: 'include',
          });
          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            setStats(statsData);
          }
        } else {
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
        router.push('/auth/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminData();
  }, [router]);

  // Fetch users when users tab is active
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab, usersPage, usersSearch, usersRole]);

  // Fetch movies when movies tab is active
  useEffect(() => {
    if (activeTab === 'movies') {
      fetchMovies();
    }
  }, [activeTab, moviesPage, moviesSearch]);

  // Fetch series when series tab is active
  useEffect(() => {
    if (activeTab === 'series') {
      fetchSeries();
    }
  }, [activeTab, seriesPage, seriesSearch]);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams({
        page: usersPage.toString(),
        limit: '10',
        ...(usersSearch && { search: usersSearch }),
        ...(usersRole && { role: usersRole })
      });

      const response = await fetch(`/api/admin/users?${params}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setUsersTotal(data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchMovies = async () => {
    setMoviesLoading(true);
    try {
      const params = new URLSearchParams({
        page: moviesPage.toString(),
        limit: '20',
        ...(moviesSearch && { search: moviesSearch })
      });

      const response = await fetch(`/api/admin/movies?${params}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setMovies(data.movies);
        setMoviesTotal(data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setMoviesLoading(false);
    }
  };

  const fetchSeries = async () => {
    setSeriesLoading(true);
    try {
      const params = new URLSearchParams({
        page: seriesPage.toString(),
        limit: '20',
        ...(seriesSearch && { search: seriesSearch })
      });

      const response = await fetch(`/api/admin/series?${params}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setSeries(data.series);
        setSeriesTotal(data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching series:', error);
    } finally {
      setSeriesLoading(false);
    }
  };

  const handleUserAction = async (action: string, userId?: number) => {
    try {
      if (action === 'delete' && userId) {
        const response = await fetch(`/api/admin/users?id=${userId}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (response.ok) {
          fetchUsers();
          setSelectedUsers([]);
        }
      } else if (action === 'edit' && userId) {
        const userToEdit = users.find(u => u.id === userId);
        setEditingUser(userToEdit || null);
        setShowUserModal(true);
      }
    } catch (error) {
      console.error('Error handling user action:', error);
    }
  };

  const handleMovieAction = async (action: string, movieId?: number) => {
    try {
      if (action === 'delete' && movieId) {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce film ?')) {
          const response = await fetch(`/api/admin/movies/${movieId}`, {
            method: 'DELETE',
            credentials: 'include',
          });

          if (response.ok) {
            fetchMovies();
          } else {
            alert('Erreur lors de la suppression du film');
          }
        }
      }
    } catch (error) {
      console.error('Error handling movie action:', error);
    }
  };

  const handleSeriesAction = async (action: string, seriesId?: number) => {
    try {
      if (action === 'delete' && seriesId) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette série ?')) {
          const response = await fetch(`/api/admin/series/${seriesId}`, {
            method: 'DELETE',
            credentials: 'include',
          });

          if (response.ok) {
            fetchSeries();
          } else {
            alert('Erreur lors de la suppression de la série');
          }
        }
      }
    } catch (error) {
      console.error('Error handling series action:', error);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) return;

    try {
      const response = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action,
          userIds: selectedUsers
        })
      });

      if (response.ok) {
        fetchUsers();
        setSelectedUsers([]);
      }
    } catch (error) {
      console.error('Error handling bulk action:', error);
    }
  };

  const searchTmdb = async () => {
    if (!tmdbSearchQuery.trim()) return;

    setTmdbSearchLoading(true);
    try {
      const response = await fetch(`/api/admin/tmdb/search?query=${encodeURIComponent(tmdbSearchQuery)}&type=${tmdbSearchType}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setTmdbSearchResults(data.results);
      }
    } catch (error) {
      console.error('Error searching TMDB:', error);
    } finally {
      setTmdbSearchLoading(false);
    }
  };

  const importFromTmdb = async (tmdbId: number, type: string) => {
    setTmdbImportLoading(true);
    try {
      const response = await fetch('/api/admin/tmdb/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tmdbId, type })
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        // Rafraîchir les résultats pour mettre à jour le statut
        searchTmdb();
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error}`);
      }
    } catch (error) {
      alert('Erreur lors de l\'importation');
    } finally {
      setTmdbImportLoading(false);
    }
  };

  const bulkImportFromTmdb = async (type: string) => {
    if (!confirm(`Importer les ${type === 'movies' ? 'films' : 'séries'} populaires ?`)) return;

    setTmdbImportLoading(true);
    try {
      const response = await fetch('/api/admin/tmdb/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type, limit: 20 })
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error}`);
      }
    } catch (error) {
      alert('Erreur lors de l\'import en lot');
    } finally {
      setTmdbImportLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center">
            <i className="ti ti-settings mr-3"></i>
            Administration ZTV+
          </h1>
          <div className="text-gray-400 text-sm">
            Connecté en tant que <span className="text-blue-400 font-medium">{user.name || user.username}</span>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-md transition-colors flex items-center ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <i className="ti ti-dashboard mr-2"></i>
            Tableau de bord
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-md transition-colors flex items-center ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <i className="ti ti-users mr-2"></i>
            Utilisateurs
          </button>
          <button
            onClick={() => setActiveTab('movies')}
            className={`px-4 py-2 rounded-md transition-colors flex items-center ${
              activeTab === 'movies'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <i className="ti ti-movie mr-2"></i>
            Films
          </button>
          <button
            onClick={() => setActiveTab('series')}
            className={`px-4 py-2 rounded-md transition-colors flex items-center ${
              activeTab === 'series'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <i className="ti ti-device-tv mr-2"></i>
            Séries
          </button>
          <button
            onClick={() => setActiveTab('episodes')}
            className={`px-4 py-2 rounded-md transition-colors flex items-center ${
              activeTab === 'episodes'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <i className="ti ti-list mr-2"></i>
            Épisodes
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-4 py-2 rounded-md transition-colors flex items-center ${
              activeTab === 'videos'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <i className="ti ti-video mr-2"></i>
            Vidéos
          </button>
          <button
            onClick={() => setActiveTab('genres')}
            className={`px-4 py-2 rounded-md transition-colors flex items-center ${
              activeTab === 'genres'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <i className="ti ti-tags mr-2"></i>
            Genres
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-md transition-colors flex items-center ${
              activeTab === 'categories'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <i className="ti ti-category mr-2"></i>
            Catégories
          </button>
          <button
            onClick={() => setActiveTab('tmdb')}
            className={`px-4 py-2 rounded-md transition-colors flex items-center ${
              activeTab === 'tmdb'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <i className="ti ti-brand-tmdb mr-2"></i>
            TMDB
          </button>
          <button
            onClick={() => router.push('/admin/password-resets')}
            className="px-4 py-2 rounded-md transition-colors flex items-center bg-orange-600 hover:bg-orange-700 text-white"
          >
            <i className="ti ti-shield-lock mr-2"></i>
            Tokens de reset
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <div className="bg-gray-900 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Utilisateurs totaux</p>
                    <p className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</p>
                  </div>
                  <i className="ti ti-users text-blue-400 text-2xl"></i>
                </div>
              </div>
              
              <div className="bg-gray-900 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Films</p>
                    <p className="text-2xl font-bold text-white">{stats?.totalMovies || 0}</p>
                  </div>
                  <i className="ti ti-movie text-green-400 text-2xl"></i>
                </div>
              </div>
              
              <div className="bg-gray-900 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Séries</p>
                    <p className="text-2xl font-bold text-white">{stats?.totalSeries || 0}</p>
                  </div>
                  <i className="ti ti-device-tv text-purple-400 text-2xl"></i>
                </div>
              </div>
              
              <div className="bg-gray-900 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Saisons</p>
                    <p className="text-2xl font-bold text-white">{stats?.totalSeasons || 0}</p>
                  </div>
                  <i className="ti ti-calendar text-indigo-400 text-2xl"></i>
                </div>
              </div>
              
              <div className="bg-gray-900 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Épisodes</p>
                    <p className="text-2xl font-bold text-white">{stats?.totalEpisodes || 0}</p>
                  </div>
                  <i className="ti ti-list text-orange-400 text-2xl"></i>
                </div>
              </div>
              
              <div className="bg-gray-900 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Vidéos</p>
                    <p className="text-2xl font-bold text-white">{stats?.totalVideos || 0}</p>
                  </div>
                  <i className="ti ti-video text-red-400 text-2xl"></i>
                </div>
              </div>
              
              <div className="bg-gray-900 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Genres</p>
                    <p className="text-2xl font-bold text-white">{stats?.totalGenres || 0}</p>
                  </div>
                  <i className="ti ti-tags text-yellow-400 text-2xl"></i>
                </div>
              </div>
              
              <div className="bg-gray-900 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Catégories</p>
                    <p className="text-2xl font-bold text-white">{stats?.totalCategories || 0}</p>
                  </div>
                  <i className="ti ti-category text-pink-400 text-2xl"></i>
                </div>
              </div>
              
              <div className="bg-gray-900 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Utilisateurs actifs</p>
                    <p className="text-2xl font-bold text-white">{stats?.activeUsers || 0}</p>
                  </div>
                  <i className="ti ti-user-check text-green-400 text-2xl"></i>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <i className="ti ti-bolt mr-2"></i>
                Actions rapides
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md transition-colors flex items-center justify-center">
                  <i className="ti ti-plus mr-2"></i>
                  Ajouter un film
                </button>
                <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-md transition-colors flex items-center justify-center">
                  <i className="ti ti-plus mr-2"></i>
                  Ajouter une série
                </button>
                <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-md transition-colors flex items-center justify-center">
                  <i className="ti ti-upload mr-2"></i>
                  Upload vidéo
                </button>
                <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-md transition-colors flex items-center justify-center">
                  <i className="ti ti-users mr-2"></i>
                  Gérer utilisateurs
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-gray-900 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <i className="ti ti-users mr-2"></i>
                Gestion des utilisateurs
              </h2>
              <button 
                onClick={() => {
                  setEditingUser(null);
                  setShowUserModal(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors flex items-center"
              >
                <i className="ti ti-plus mr-2"></i>
                Nouvel utilisateur
              </button>
            </div>

            {/* Filters and Search */}
            <div className="mb-6 space-y-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                  <input
                    type="text"
                    placeholder="Rechercher par nom, email ou username..."
                    value={usersSearch}
                    onChange={(e) => setUsersSearch(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={usersRole}
                  onChange={(e) => setUsersRole(e.target.value)}
                  className="px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tous les rôles</option>
                  <option value="USER">Utilisateur</option>
                  <option value="ADMIN">Administrateur</option>
                  <option value="MODERATOR">Modérateur</option>
                </select>
              </div>

              {/* Bulk Actions */}
              {selectedUsers.length > 0 && (
                <div className="flex items-center gap-2 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
                  <span className="text-blue-400 text-sm">
                    {selectedUsers.length} utilisateur(s) sélectionné(s)
                  </span>
                  <div className="flex gap-2 ml-auto">
                    <button
                      onClick={() => handleBulkAction('activate')}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Activer
                    </button>
                    <button
                      onClick={() => handleBulkAction('deactivate')}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Désactiver
                    </button>
                    <button
                      onClick={() => handleBulkAction('delete')}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="pb-3">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === users.length && users.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(users.map(u => u.id));
                          } else {
                            setSelectedUsers([]);
                          }
                        }}
                        className="rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="pb-3 text-gray-300 font-medium">Utilisateur</th>
                    <th className="pb-3 text-gray-300 font-medium">Rôle</th>
                    <th className="pb-3 text-gray-300 font-medium">Statut</th>
                    <th className="pb-3 text-gray-300 font-medium">Sessions</th>
                    <th className="pb-3 text-gray-300 font-medium">Créé le</th>
                    <th className="pb-3 text-gray-300 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersLoading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-400">
                        <i className="ti ti-loader-2 animate-spin text-2xl mb-2 block"></i>
                        Chargement...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-400">
                        <i className="ti ti-users text-4xl mb-4 block"></i>
                        Aucun utilisateur trouvé
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                        <td className="py-4">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers([...selectedUsers, user.id]);
                              } else {
                                setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                              }
                            }}
                            className="rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-4">
                          <div className="flex items-center space-x-3">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                {user.name?.charAt(0) || user.username?.charAt(0) || 'U'}
                              </div>
                            )}
                            <div>
                              <div className="text-white font-medium">{user.name || 'Sans nom'}</div>
                              <div className="text-gray-400 text-sm">@{user.username}</div>
                              <div className="text-gray-500 text-xs">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'ADMIN' ? 'bg-red-900 text-red-300' :
                            user.role === 'MODERATOR' ? 'bg-yellow-900 text-yellow-300' :
                            'bg-blue-900 text-blue-300'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.isActive ? 'bg-green-900 text-green-300' : 'bg-gray-900 text-gray-300'
                          }`}>
                            {user.isActive ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="py-4 text-gray-400 text-sm">
                          {user._count?.sessions || 0}
                        </td>
                        <td className="py-4 text-gray-400 text-sm">
                          {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleUserAction('edit', user.id)}
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                              title="Modifier"
                            >
                              <i className="ti ti-edit"></i>
                            </button>
                            <button
                              onClick={() => handleUserAction('delete', user.id)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                              title="Supprimer"
                            >
                              <i className="ti ti-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {usersTotal > 10 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-gray-400 text-sm">
                  Affichage de {((usersPage - 1) * 10) + 1} à {Math.min(usersPage * 10, usersTotal)} sur {usersTotal} utilisateurs
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setUsersPage(prev => Math.max(1, prev - 1))}
                    disabled={usersPage === 1}
                    className="px-3 py-1 bg-gray-800 text-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                  >
                    Précédent
                  </button>
                  <span className="text-gray-400 text-sm">
                    Page {usersPage} sur {Math.ceil(usersTotal / 10)}
                  </span>
                  <button
                    onClick={() => setUsersPage(prev => prev + 1)}
                    disabled={usersPage >= Math.ceil(usersTotal / 10)}
                    className="px-3 py-1 bg-gray-800 text-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Movies Tab */}
        {activeTab === 'movies' && (
          <div className="bg-gray-900 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <i className="ti ti-movie mr-2"></i>
                Gestion des films ({moviesTotal})
              </h2>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors flex items-center">
                <i className="ti ti-plus mr-2"></i>
                Nouveau film
              </button>
            </div>

            {/* Search and filters */}
            <div className="mb-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Rechercher un film..."
                    value={moviesSearch}
                    onChange={(e) => setMoviesSearch(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={() => setMoviesPage(1)}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
                >
                  <i className="ti ti-search"></i>
                </button>
              </div>
            </div>

            {/* Movies List */}
            {moviesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-400 mt-2">Chargement des films...</p>
              </div>
            ) : movies.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                <i className="ti ti-movie text-4xl mb-4 block"></i>
                <p>Aucun film trouvé</p>
              </div>
            ) : (
              <div className="space-y-4">
                {movies.map((movie) => (
                  <div key={movie.id} className="bg-gray-800 rounded-lg p-4 flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {movie.poster ? (
                        <img
                          src={movie.poster.startsWith('http') 
                            ? movie.poster 
                            : `https://image.tmdb.org/t/p/w200${movie.poster}`
                          }
                          alt={movie.title}
                          className="w-16 h-24 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-24 bg-gray-700 rounded flex items-center justify-center">
                          <i className="ti ti-movie text-gray-500"></i>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-lg truncate">{movie.title}</h3>
                      <p className="text-gray-400 text-sm">{movie.originalTitle || movie.title}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-300">
                        {movie.year && <span>{movie.year}</span>}
                        {movie.rating && (
                          <span className="flex items-center">
                            <i className="ti ti-star-filled text-yellow-400 mr-1"></i>
                            {Math.round(movie.rating * 10) / 10}
                          </span>
                        )}
                        {movie.duration && (
                          <span>{Math.floor(movie.duration / 60)}h {movie.duration % 60}min</span>
                        )}
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            movie.isActive ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                          }`}>
                            {movie.isActive ? 'Actif' : 'Inactif'}
                          </span>
                          {movie.isFeatured && (
                            <span className="px-2 py-1 rounded text-xs bg-yellow-600 text-white">
                              <i className="ti ti-star mr-1"></i>
                              Vedette
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => router.push(`/admin/movies/${movie.id}/edit`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        <i className="ti ti-edit mr-1"></i>
                        Modifier
                      </button>
                      <button 
                        onClick={() => handleMovieAction('delete', movie.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        <i className="ti ti-trash mr-1"></i>
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {moviesTotal > 20 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-gray-400 text-sm">
                  Affichage de {((moviesPage - 1) * 20) + 1} à {Math.min(moviesPage * 20, moviesTotal)} sur {moviesTotal} films
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setMoviesPage(prev => Math.max(1, prev - 1))}
                    disabled={moviesPage === 1}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded text-sm transition-colors"
                  >
                    Précédent
                  </button>
                  <span className="text-gray-400 text-sm">
                    Page {moviesPage} sur {Math.ceil(moviesTotal / 20)}
                  </span>
                  <button
                    onClick={() => setMoviesPage(prev => prev + 1)}
                    disabled={moviesPage >= Math.ceil(moviesTotal / 20)}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded text-sm transition-colors"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Series Tab */}
        {activeTab === 'series' && (
          <div className="bg-gray-900 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <i className="ti ti-device-tv mr-2"></i>
                Gestion des séries ({seriesTotal})
              </h2>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors flex items-center">
                <i className="ti ti-plus mr-2"></i>
                Nouvelle série
              </button>
            </div>

            {/* Search and filters */}
            <div className="mb-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Rechercher une série..."
                    value={seriesSearch}
                    onChange={(e) => setSeriesSearch(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={() => setSeriesPage(1)}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
                >
                  <i className="ti ti-search"></i>
                </button>
              </div>
            </div>

            {/* Series List */}
            {seriesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-400 mt-2">Chargement des séries...</p>
              </div>
            ) : series.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                <i className="ti ti-device-tv text-4xl mb-4 block"></i>
                <p>Aucune série trouvée</p>
              </div>
            ) : (
              <div className="space-y-4">
                {series.map((serie) => (
                  <div key={serie.id} className="bg-gray-800 rounded-lg p-4 flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {serie.poster ? (
                        <img
                          src={serie.poster.startsWith('http') 
                            ? serie.poster 
                            : `https://image.tmdb.org/t/p/w200${serie.poster}`
                          }
                          alt={serie.title}
                          className="w-16 h-24 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-24 bg-gray-700 rounded flex items-center justify-center">
                          <i className="ti ti-device-tv text-gray-500"></i>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-lg truncate">{serie.title}</h3>
                      <p className="text-gray-400 text-sm">{serie.originalTitle || serie.title}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-300">
                        {serie.year && <span>{serie.year}</span>}
                        {serie.rating && (
                          <span className="flex items-center">
                            <i className="ti ti-star-filled text-yellow-400 mr-1"></i>
                            {Math.round(serie.rating * 10) / 10}
                          </span>
                        )}
                        {serie.numberOfSeasons && (
                          <span>{serie.numberOfSeasons} saison{serie.numberOfSeasons > 1 ? 's' : ''}</span>
                        )}
                        {serie.numberOfEpisodes && (
                          <span>{serie.numberOfEpisodes} épisode{serie.numberOfEpisodes > 1 ? 's' : ''}</span>
                        )}
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            serie.isActive ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                          }`}>
                            {serie.isActive ? 'Actif' : 'Inactif'}
                          </span>
                          {serie.isFeatured && (
                            <span className="px-2 py-1 rounded text-xs bg-yellow-600 text-white">
                              <i className="ti ti-star mr-1"></i>
                              Vedette
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => router.push(`/admin/series/${serie.id}/edit`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        <i className="ti ti-edit mr-1"></i>
                        Modifier
                      </button>
                      <button 
                        onClick={() => handleSeriesAction('delete', serie.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        <i className="ti ti-trash mr-1"></i>
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {seriesTotal > 20 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-gray-400 text-sm">
                  Affichage de {((seriesPage - 1) * 20) + 1} à {Math.min(seriesPage * 20, seriesTotal)} sur {seriesTotal} séries
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSeriesPage(prev => Math.max(1, prev - 1))}
                    disabled={seriesPage === 1}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded text-sm transition-colors"
                  >
                    Précédent
                  </button>
                  <span className="text-gray-400 text-sm">
                    Page {seriesPage} sur {Math.ceil(seriesTotal / 20)}
                  </span>
                  <button
                    onClick={() => setSeriesPage(prev => prev + 1)}
                    disabled={seriesPage >= Math.ceil(seriesTotal / 20)}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded text-sm transition-colors"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Episodes Tab */}
        {activeTab === 'episodes' && (
          <div className="bg-gray-900 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <i className="ti ti-list mr-2"></i>
                Gestion des épisodes
              </h2>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors flex items-center">
                <i className="ti ti-plus mr-2"></i>
                Nouvel épisode
              </button>
            </div>
            <div className="text-gray-400 text-center py-8">
              <i className="ti ti-list text-4xl mb-4 block"></i>
              <p>Gestion des épisodes en cours de développement...</p>
            </div>
          </div>
        )}

        {/* Videos Tab */}
        {activeTab === 'videos' && (
          <div className="bg-gray-900 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <i className="ti ti-video mr-2"></i>
                Gestion des vidéos
              </h2>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors flex items-center">
                <i className="ti ti-plus mr-2"></i>
                Nouvelle vidéo
              </button>
            </div>
            <div className="text-gray-400 text-center py-8">
              <i className="ti ti-video text-4xl mb-4 block"></i>
              <p>Gestion des vidéos en cours de développement...</p>
            </div>
          </div>
        )}

        {/* Genres Tab */}
        {activeTab === 'genres' && (
          <div className="bg-gray-900 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <i className="ti ti-tags mr-2"></i>
                Gestion des genres
              </h2>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors flex items-center">
                <i className="ti ti-plus mr-2"></i>
                Nouveau genre
              </button>
            </div>
            <div className="text-gray-400 text-center py-8">
              <i className="ti ti-tags text-4xl mb-4 block"></i>
              <p>Gestion des genres en cours de développement...</p>
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="bg-gray-900 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <i className="ti ti-category mr-2"></i>
                Gestion des catégories
              </h2>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors flex items-center">
                <i className="ti ti-plus mr-2"></i>
                Nouvelle catégorie
              </button>
            </div>
            <div className="text-gray-400 text-center py-8">
              <i className="ti ti-category text-4xl mb-4 block"></i>
              <p>Gestion des catégories en cours de développement...</p>
            </div>
          </div>
        )}

        {/* TMDB Tab */}
        {activeTab === 'tmdb' && (
          <div className="bg-gray-900 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <i className="ti ti-brand-tmdb mr-2"></i>
                Configuration TMDB
              </h2>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors flex items-center">
                <i className="ti ti-settings mr-2"></i>
                Configurer
              </button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-2 flex items-center">
                    <i className="ti ti-key mr-2"></i>
                    Configuration API
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Configurez votre clé API TMDB pour synchroniser les données.
                  </p>
                  <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm transition-colors">
                    Configurer l'API
                  </button>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-2 flex items-center">
                    <i className="ti ti-settings mr-2"></i>
                    Initialisation
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Initialisez la configuration depuis les variables d'environnement.
                  </p>
                  <button 
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/admin/tmdb/init', {
                          method: 'POST',
                          credentials: 'include',
                        });
                        if (response.ok) {
                          alert('Configuration TMDB initialisée avec succès !');
                        } else {
                          const error = await response.json();
                          alert(`Erreur: ${error.error}`);
                        }
                      } catch (error) {
                        alert('Erreur lors de l\'initialisation');
                      }
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-md text-sm transition-colors"
                  >
                    Initialiser depuis .env
                  </button>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-2 flex items-center">
                    <i className="ti ti-refresh mr-2"></i>
                    Synchronisation
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Synchronisez les films et séries depuis TMDB.
                  </p>
                  <button 
                    onClick={async () => {
                      if (!confirm('Voulez-vous synchroniser les films et séries existants avec les dernières données TMDB ?')) return;
                      
                      try {
                        // Synchroniser les films
                        const moviesResponse = await fetch('/api/admin/tmdb/sync', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                          body: JSON.stringify({ type: 'movies', limit: 20 })
                        });
                        
                        const moviesResult = await moviesResponse.json();
                        
                        // Synchroniser les séries
                        const seriesResponse = await fetch('/api/admin/tmdb/sync', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                          body: JSON.stringify({ type: 'series', limit: 20 })
                        });
                        
                        const seriesResult = await seriesResponse.json();
                        
                        if (moviesResponse.ok && seriesResponse.ok) {
                          alert(`Synchronisation terminée !\n\nFilms: ${moviesResult.summary.success} synchronisés, ${moviesResult.summary.errors} erreurs\nSéries: ${seriesResult.summary.success} synchronisées, ${seriesResult.summary.errors} erreurs`);
                          // Recharger les stats
                          window.location.reload();
                        } else {
                          alert('Erreur lors de la synchronisation');
                        }
                      } catch (error) {
                        alert('Erreur lors de la synchronisation');
                        console.error('Sync error:', error);
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm transition-colors"
                  >
                    Synchroniser
                  </button>
                </div>
              </div>
              
              {/* TMDB Search and Import */}
              <div className="space-y-6">
                {/* Search Section */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-white font-medium mb-4 flex items-center">
                    <i className="ti ti-search mr-2"></i>
                    Rechercher sur TMDB
                  </h3>
                  
                  <div className="flex flex-wrap gap-4 mb-4">
                    <div className="flex-1 min-w-64">
                      <input
                        type="text"
                        placeholder="Rechercher des films ou séries..."
                        value={tmdbSearchQuery}
                        onChange={(e) => setTmdbSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && searchTmdb()}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <select
                      value={tmdbSearchType}
                      onChange={(e) => setTmdbSearchType(e.target.value)}
                      className="px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="movie">Films</option>
                      <option value="tv">Séries</option>
                    </select>
                    <button
                      onClick={searchTmdb}
                      disabled={tmdbSearchLoading || !tmdbSearchQuery.trim()}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded transition-colors flex items-center"
                    >
                      {tmdbSearchLoading ? (
                        <i className="ti ti-loader-2 animate-spin mr-2"></i>
                      ) : (
                        <i className="ti ti-search mr-2"></i>
                      )}
                      Rechercher
                    </button>
                  </div>

                  {/* Search Results */}
                  {tmdbSearchResults.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-gray-300 font-medium">Résultats ({tmdbSearchResults.length})</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tmdbSearchResults.map((item) => (
                          <div key={item.id} className="bg-gray-700 rounded-lg p-4">
                            <div className="flex space-x-3">
                              {item.posterUrl && (
                                <img
                                  src={item.posterUrl}
                                  alt={item.title}
                                  className="w-16 h-24 object-cover rounded"
                                />
                              )}
                              <div className="flex-1">
                                <h5 className="text-white font-medium text-sm">{item.title}</h5>
                                <p className="text-gray-400 text-xs mt-1">
                                  {item.releaseDate ? new Date(item.releaseDate).getFullYear() : 'N/A'}
                                </p>
                                <p className="text-gray-500 text-xs mt-1 line-clamp-2">
                                  {item.overview}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    item.isImported 
                                      ? 'bg-green-900 text-green-300' 
                                      : 'bg-blue-900 text-blue-300'
                                  }`}>
                                    {item.isImported ? 'Importé' : 'Disponible'}
                                  </span>
                                  {!item.isImported && (
                                    <button
                                      onClick={() => importFromTmdb(item.id, tmdbSearchType)}
                                      disabled={tmdbImportLoading}
                                      className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-2 py-1 rounded text-xs transition-colors"
                                    >
                                      {tmdbImportLoading ? 'Import...' : 'Importer'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bulk Import Section */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-white font-medium mb-4 flex items-center">
                    <i className="ti ti-download mr-2"></i>
                    Import en lot
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-2">Films populaires</h4>
                      <p className="text-gray-400 text-sm mb-3">
                        Importer les 20 films les plus populaires de TMDB
                      </p>
                      <button
                        onClick={() => bulkImportFromTmdb('movies')}
                        disabled={tmdbImportLoading}
                        className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded transition-colors flex items-center"
                      >
                        {tmdbImportLoading ? (
                          <i className="ti ti-loader-2 animate-spin mr-2"></i>
                        ) : (
                          <i className="ti ti-movie mr-2"></i>
                        )}
                        Importer les films
                      </button>
                    </div>
                    
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-2">Séries populaires</h4>
                      <p className="text-gray-400 text-sm mb-3">
                        Importer les 20 séries les plus populaires de TMDB
                      </p>
                      <button
                        onClick={() => bulkImportFromTmdb('series')}
                        disabled={tmdbImportLoading}
                        className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded transition-colors flex items-center"
                      >
                        {tmdbImportLoading ? (
                          <i className="ti ti-loader-2 animate-spin mr-2"></i>
                        ) : (
                          <i className="ti ti-device-tv mr-2"></i>
                        )}
                        Importer les séries
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Analytics />
    </div>
  );
}
