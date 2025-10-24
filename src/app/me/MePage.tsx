'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  avatar: string | null;
  timezone: string | null;
  role: string;
  createdAt: string;
}

interface UserStats {
  watchlistCount: number;
  likesCount: number;
  historyCount: number;
  totalWatchTime: number;
}

export default function MePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Vérification de l'authentification et récupération des données
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        if (!response.ok) {
          router.push('/auth/login');
          return;
        }

        const data = await response.json();
        setUser(data.user);

        // Récupérer les statistiques
        await fetchUserStats();
      } catch (error) {
        console.error('Erreur lors de la récupération des données utilisateur:', error);
        router.push('/auth/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const fetchUserStats = async () => {
    try {
      // Récupérer le nombre d'éléments dans la watchlist
      const watchlistResponse = await fetch('/api/watchlist', {
        credentials: 'include',
      });
      const watchlistData = await watchlistResponse.json();

      // Récupérer le nombre de likes
      const likesResponse = await fetch('/api/likes', {
        credentials: 'include',
      });
      const likesData = await likesResponse.json();

      // Récupérer le nombre d'éléments dans l'historique
      const historyResponse = await fetch('/api/history?limit=1&offset=0', {
        credentials: 'include',
      });
      const historyData = await historyResponse.json();

      setStats({
        watchlistCount: watchlistData.data?.length || 0,
        likesCount: likesData.data?.length || 0,
        historyCount: historyData.pagination?.total || 0,
        totalWatchTime: 0 // À implémenter plus tard si nécessaire
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    // Utiliser le timezone de l'utilisateur ou UTC par défaut
    const userTimezone = user?.timezone || 'Europe/Paris';

    try {
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
  };

  const getRegistrationDate = (dateString: string) => {
    const now = new Date();
    const registrationDate = new Date(dateString);
    const diffTime = Math.abs(now.getTime() - registrationDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) {
      return `Membre depuis ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `Membre depuis ${months} mois`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `Membre depuis ${years} an${years > 1 ? 's' : ''}`;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête du profil */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || user.username}
                  className="w-20 h-20 rounded-full border-4 border-blue-500/50"
                />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-4 border-blue-500/50">
                  <span className="text-2xl font-bold text-white">
                    {(user.name || user.username).charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-black flex items-center justify-center">
                <i className="ti ti-check text-white text-xs"></i>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-white">
                  {user.name || user.username}
                </h1>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                  user.role === 'ADMIN'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : user.role === 'MODERATOR'
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}>
                  <i className={`ti mr-1.5 text-sm ${
                    user.role === 'ADMIN' ? 'ti-shield' :
                    user.role === 'MODERATOR' ? 'ti-star' : 'ti-user'
                  }`}></i>
                  {user.role === 'ADMIN' ? 'Administrateur' :
                   user.role === 'MODERATOR' ? 'Modérateur' : 'Membre'}
                </span>
              </div>

              <p className="text-gray-400 mb-2">{user.email}</p>

              <div className="flex items-center space-x-3">
                <span className="inline-flex items-center px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg text-sm">
                  <i className="ti ti-calendar-check mr-2"></i>
                  {getRegistrationDate(user.createdAt)}
                </span>

                <span className="inline-flex items-center px-3 py-1 bg-gray-500/10 text-gray-400 border border-gray-500/20 rounded-lg text-sm">
                  <i className="ti ti-clock mr-2"></i>
                  Membre depuis le {formatDate(user.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Statistiques rapides */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50 text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <i className="ti ti-bookmark text-blue-400 text-xl"></i>
              </div>
              <div className="text-2xl font-bold text-white">{stats?.watchlistCount || 0}</div>
              <div className="text-sm text-gray-400">Watchlist</div>
            </div>

            <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50 text-center">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <i className="ti ti-heart text-red-400 text-xl"></i>
              </div>
              <div className="text-2xl font-bold text-white">{stats?.likesCount || 0}</div>
              <div className="text-sm text-gray-400">Likes</div>
            </div>

            <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50 text-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <i className="ti ti-history text-green-400 text-xl"></i>
              </div>
              <div className="text-2xl font-bold text-white">{stats?.historyCount || 0}</div>
              <div className="text-sm text-gray-400">Visionnés</div>
            </div>

            <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50 text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <i className="ti ti-settings text-purple-400 text-xl"></i>
              </div>
              <div className="text-lg font-bold text-white">--</div>
              <div className="text-sm text-gray-400">Paramètres</div>
            </div>
          </div>
        </div>

        {/* Raccourcis rapides */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link
            href="/watchlist"
            className="group bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-6 hover:bg-blue-500/20 transition-all duration-300 transform hover:scale-105"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                <i className="ti ti-bookmark text-blue-400 text-xl"></i>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white group-hover:text-blue-300 transition-colors">
                  Ma Watchlist
                </h3>
                <p className="text-gray-400 text-sm">
                  {stats?.watchlistCount || 0} contenu{stats?.watchlistCount !== 1 ? 's' : ''} sauvegardé{stats?.watchlistCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/likes"
            className="group bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/20 rounded-xl p-6 hover:bg-red-500/20 transition-all duration-300 transform hover:scale-105"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center group-hover:bg-red-500/30 transition-colors">
                <i className="ti ti-heart text-red-400 text-xl"></i>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white group-hover:text-red-300 transition-colors">
                  Mes Likes
                </h3>
                <p className="text-gray-400 text-sm">
                  {stats?.likesCount || 0} contenu{stats?.likesCount !== 1 ? 's' : ''} aimé{stats?.likesCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/history"
            className="group bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl p-6 hover:bg-green-500/20 transition-all duration-300 transform hover:scale-105 md:col-span-2 lg:col-span-1"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                <i className="ti ti-history text-green-400 text-xl"></i>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white group-hover:text-green-300 transition-colors">
                  Historique
                </h3>
                <p className="text-gray-400 text-sm">
                  {stats?.historyCount || 0} contenu{stats?.historyCount !== 1 ? 's' : ''} visionné{stats?.historyCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Actions supplémentaires */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/account"
            className="group bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-6 hover:bg-purple-500/20 transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                  <i className="ti ti-user text-purple-400 text-xl"></i>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">
                    Mon Compte
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Gérer mes informations personnelles
                  </p>
                </div>
              </div>
              <i className="ti ti-chevron-right text-gray-400 group-hover:text-purple-400 transition-colors"></i>
            </div>
          </Link>

          <Link
            href="/settings"
            className="group bg-gradient-to-br from-gray-500/10 to-gray-600/10 border border-gray-500/20 rounded-xl p-6 hover:bg-gray-500/20 transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-500/20 rounded-xl flex items-center justify-center group-hover:bg-gray-500/30 transition-colors">
                  <i className="ti ti-settings text-gray-400 text-xl"></i>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white group-hover:text-gray-300 transition-colors">
                    Paramètres
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Personnaliser mon expérience
                  </p>
                </div>
              </div>
              <i className="ti ti-chevron-right text-gray-400 group-hover:text-gray-300 transition-colors"></i>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
