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
  timezone: string | null;
  role: string;
  createdAt: string;
}

interface Session {
  id: number | string;
  token: string;
  ipAddress: string;
  device: string;
  browser: string;
  os: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [isUploading, setIsUploading] = useState(false);
  const [sessionStats, setSessionStats] = useState({ total: 0, active: 0 });
  const [isDeletingSession, setIsDeletingSession] = useState<number | string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Password reset states
  const [isRequestingReset, setIsRequestingReset] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');

  // History states
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        router.push('/auth/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  useEffect(() => {
  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/auth/sessions', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions);
        setSessionStats({ total: data.total, active: data.active });
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  if (user) {
  fetchSessions();
  }
  }, [user]);

  // Fetch history when history tab is active
  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, historyPage]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '20',
        offset: ((historyPage - 1) * 20).toString()
      });

      const response = await fetch(`/api/history?${params}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setHistory(data.data);
        setHistoryTotal(data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    // Utiliser le timezone de l'utilisateur ou UTC par défaut
    const userTimezone = user?.timezone || 'Europe/Paris';

    try {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: userTimezone
      });
    } catch (error) {
      // Fallback en cas d'erreur de timezone
      console.warn('Erreur timezone, utilisation UTC:', error);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/auth/avatar', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUser(prev => prev ? { ...prev, avatar: data.avatar } : null);
        alert('Avatar mis à jour avec succès !');
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error}`);
      }
    } catch (error) {
      console.error('Avatar upload failed:', error);
      alert('Erreur lors de la mise à jour de l\'avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteSession = async (sessionId: number | string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette session ?')) {
      return;
    }

    console.log('Tentative de suppression de session ID:', sessionId, 'Type:', typeof sessionId);
    setIsDeletingSession(sessionId);
    try {
      const response = await fetch(`/api/auth/sessions/${sessionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        // Recharger les sessions
        const sessionsResponse = await fetch('/api/auth/sessions', {
          credentials: 'include',
        });
        
        if (sessionsResponse.ok) {
          const data = await sessionsResponse.json();
          setSessions(data.sessions);
          setSessionStats({ total: data.total, active: data.active });
        }
        alert('Session supprimée avec succès !');
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error}`);
      }
    } catch (error) {
      console.error('Session deletion failed:', error);
      alert('Erreur lors de la suppression de la session');
    } finally {
      setIsDeletingSession(null);
    }
  };

  const handleDeleteAllOtherSessions = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer toutes les autres sessions ? Vous serez déconnecté de tous les autres appareils.')) {
      return;
    }

    try {
      const response = await fetch('/api/auth/sessions', {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        // Recharger les sessions
        const sessionsResponse = await fetch('/api/auth/sessions', {
          credentials: 'include',
        });
        
        if (sessionsResponse.ok) {
          const sessionsData = await sessionsResponse.json();
          setSessions(sessionsData.sessions);
          setSessionStats({ total: sessionsData.total, active: sessionsData.active });
        }
        alert(`Toutes les autres sessions ont été supprimées (${data.deletedCount} sessions supprimées) !`);
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error}`);
      }
    } catch (error) {
      console.error('Sessions deletion failed:', error);
      alert('Erreur lors de la suppression des sessions');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      alert('Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (response.ok) {
        alert('Mot de passe modifié avec succès !');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setShowPasswordForm(false);
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error}`);
      }
    } catch (error) {
      console.error('Password change failed:', error);
      alert('Erreur lors de la modification du mot de passe');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handlePasswordResetRequest = async () => {
    if (!user?.email) return;

    setIsRequestingReset(true);
    setResetError('');
    setResetMessage('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email }),
      });

      const data = await response.json();

      if (data.success) {
        setResetMessage('Un email de réinitialisation a été envoyé à votre adresse email. L\'administrateur doit d\'abord activer votre demande.');
      } else {
        setResetError(data.error || 'Une erreur est survenue');
      }
    } catch (err) {
      setResetError('Erreur de connexion');
    } finally {
      setIsRequestingReset(false);
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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Mon compte</h1>
        
        {/* Tabs */}
        <div className="flex space-x-1 mb-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-md transition-colors flex items-center space-x-2 ${
              activeTab === 'profile'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <i className="ti ti-user text-lg"></i>
            <span>Profil</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 rounded-md transition-colors flex items-center space-x-2 ${
              activeTab === 'security'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <i className="ti ti-shield-check text-lg"></i>
            <span>Sécurité</span>
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-4 py-2 rounded-md transition-colors flex items-center space-x-2 ${
              activeTab === 'sessions'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <i className="ti ti-device-desktop text-lg"></i>
            <span>Sessions</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-md transition-colors flex items-center space-x-2 ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <i className="ti ti-history text-lg"></i>
            <span>Historique</span>
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Informations du profil</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Nom complet
                </label>
                <input
                  type="text"
                  value={user.name || ''}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  readOnly
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Nom d'utilisateur
                </label>
                <input
                  type="text"
                  value={user.username || ''}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  readOnly
                />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={user.email}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  readOnly
                />
              </div>
              
            </div>
            
            <div className="mt-6">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Avatar
              </label>
              <div className="flex items-center space-x-4">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xl">
                    {user.name?.charAt(0) || user.username?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-gray-300 text-sm mb-2">Avatar actuel</p>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      disabled={isUploading}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <label
                      htmlFor="avatar-upload"
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                        isUploading
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {isUploading ? 'Upload en cours...' : 'Changer l\'avatar'}
                    </label>
                    <p className="text-gray-500 text-xs">
                      JPG, PNG, GIF (max 5MB)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Sécurité du compte</h2>
            
            <div className="space-y-6">
              <div className="border border-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-medium text-white mb-2">Mot de passe</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Votre mot de passe a été défini lors de l'inscription.
                </p>
                
                {!showPasswordForm ? (
                  <button 
                    onClick={() => setShowPasswordForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                  >
                    Modifier le mot de passe
                  </button>
                ) : (
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Mot de passe actuel
                      </label>
                      <input
                        type="password"
                        name="currentPassword"
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordInputChange}
                        required
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="••••••••"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Nouveau mot de passe
                      </label>
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordInputChange}
                        required
                        minLength={6}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="••••••••"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Confirmer le nouveau mot de passe
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordInputChange}
                        required
                        minLength={6}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="••••••••"
                      />
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        disabled={isChangingPassword}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 text-white px-4 py-2 rounded-md transition-colors"
                      >
                        {isChangingPassword ? 'Modification...' : 'Confirmer'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasswordForm(false);
                          setPasswordForm({
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: ''
                          });
                        }}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                )}
              </div>

               <div className="border border-gray-700 rounded-lg p-4">
                 <h3 className="text-lg font-medium text-white mb-2">Réinitialisation de mot de passe</h3>
                  <p className="text-gray-400 text-sm mb-4">
                   Recevez un lien de réinitialisation par email. Cette méthode ne nécessite pas votre mot de passe actuel.
                  </p>

                 {resetMessage && (
                 <div className="bg-blue-900/50 border border-blue-500 text-blue-400 px-4 py-3 rounded mb-4">
                   {resetMessage}
                 </div>
                 )}

                  {resetError && (
                 <div className="bg-red-900/50 border border-red-500 text-red-400 px-4 py-3 rounded mb-4">
                   {resetError}
                 </div>
               )}

               <button
                   onClick={handlePasswordResetRequest}
                   disabled={isRequestingReset}
                   className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 disabled:opacity-50 text-white px-4 py-2 rounded-md transition-colors flex items-center"
                 >
                   {isRequestingReset ? (
                     <>
                       <i className="ti ti-loader-2 mr-2 animate-spin"></i>
                       Envoi en cours...
                     </>
                   ) : (
                     <>
                       <i className="ti ti-mail mr-2"></i>
                       Recevoir un lien de réinitialisation
                     </>
                   )}
                 </button>

                 <p className="text-gray-500 text-xs mt-2">
                   Note: Un administrateur doit approuver votre demande avant que le lien ne devienne actif.
                 </p>
               </div>

               <div className="border border-gray-700 rounded-lg p-4">
                 <div className="flex items-center justify-between mb-2">
                   <h3 className="text-lg font-medium text-white">Authentification à deux facteurs</h3>
                   <span className="bg-red-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                     Indisponible
                   </span>
                 </div>
                 <p className="text-gray-400 text-sm mb-4">
                   Cette fonctionnalité sera bientôt disponible.
                 </p>
                 <button
                   disabled
                   className="bg-gray-600 text-gray-400 px-4 py-2 rounded-md cursor-not-allowed"
                 >
                   Activer 2FA
                 </button>
               </div>
            </div>
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="bg-gray-900 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <i className="ti ti-device-desktop mr-2"></i>
                Sessions actives
              </h2>
              <div className="text-sm text-gray-400">
                {sessionStats.active} / 4 sessions actives
              </div>
            </div>

            {/* Limite de sessions atteinte */}
            {sessionStats.total >= 4 && (
              <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <i className="ti ti-alert-triangle text-yellow-400 text-xl mt-0.5"></i>
                  <div>
                    <h3 className="text-yellow-400 font-medium mb-1">Limite de sessions atteinte</h3>
                    <p className="text-yellow-200 text-sm mb-3">
                      Vous avez atteint la limite de 4 sessions simultanées. Pour créer une nouvelle session, 
                      vous devez d'abord supprimer une session existante.
                    </p>
                    <button
                      onClick={handleDeleteAllOtherSessions}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
                    >
                      Supprimer toutes les autres sessions
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {session.device.toLowerCase().includes('tv') || session.device.toLowerCase().includes('smart tv') ? (
                          <i className="ti ti-tv text-purple-400 text-xl"></i>
                        ) : session.device.toLowerCase().includes('mobile') || session.device.toLowerCase().includes('phone') || session.device.toLowerCase().includes('smartphone') ? (
                          <i className="ti ti-device-mobile text-green-400 text-xl"></i>
                        ) : session.device.toLowerCase().includes('tablet') || session.device.toLowerCase().includes('ipad') ? (
                          <i className="ti ti-device-tablet text-blue-400 text-xl"></i>
                        ) : (
                          <i className="ti ti-device-laptop text-blue-400 text-xl"></i>
                        )}
                      </div>
                      <div>
                        <h3 className="text-white font-medium flex items-center">
                          {session.browser.toLowerCase().includes('chrome') ? (
                            <i className="ti ti-brand-chrome mr-2 text-blue-400"></i>
                          ) : session.browser.toLowerCase().includes('firefox') ? (
                            <i className="ti ti-brand-firefox mr-2 text-orange-400"></i>
                          ) : session.browser.toLowerCase().includes('safari') ? (
                            <i className="ti ti-brand-safari mr-2 text-blue-500"></i>
                          ) : (
                            <i className="ti ti-monitor mr-2 text-gray-400"></i>
                          )}
                          {session.device} • {session.browser}
                        </h3>
                        <p className="text-gray-400 text-sm flex items-center mt-1">
                          {session.os.toLowerCase().includes('windows') ? (
                            <i className="ti ti-brand-windows mr-2 text-blue-400"></i>
                          ) : session.os.toLowerCase().includes('mac') || session.os.toLowerCase().includes('macos') || session.os.toLowerCase().includes('darwin') ? (
                            <i className="ti ti-brand-apple mr-2 text-gray-300"></i>
                          ) : session.os.toLowerCase().includes('linux') ? (
                            <i className="ti ti-brand-ubuntu mr-2 text-orange-400"></i>
                          ) : session.os.toLowerCase().includes('android') ? (
                            <i className="ti ti-brand-android mr-2 text-green-400"></i>
                          ) : session.os.toLowerCase().includes('ios') ? (
                            <i className="ti ti-brand-apple mr-2 text-gray-300"></i>
                          ) : (
                            <i className="ti ti-world mr-2"></i>
                          )}
                          {session.os} • {session.ipAddress}
                        </p>
                        <p className="text-gray-500 text-xs flex items-center mt-1">
                          <i className="ti ti-clock mr-1"></i>
                          Dernière activité: {new Date(session.updatedAt).toLocaleDateString('fr-FR')} à {new Date(session.updatedAt).toLocaleTimeString('fr-FR')}
                        </p>
                        <p className="text-gray-500 text-xs flex items-center mt-1">
                          <i className="ti ti-calendar mr-1"></i>
                          Expire le {new Date(session.expiresAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {session.isCurrent ? (
                        <span className="bg-green-600 text-white px-2 py-1 rounded-full text-xs flex items-center">
                          <i className="ti ti-check mr-1"></i>
                          Actuelle
                        </span>
                      ) : (
                        <button
                          onClick={() => handleDeleteSession(session.id)}
                          disabled={isDeletingSession === session.id}
                          className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:opacity-50 text-white px-3 py-1 rounded-md text-xs transition-colors flex items-center"
                        >
                          {isDeletingSession === session.id ? (
                            <>
                              <i className="ti ti-loader-2 mr-1 animate-spin"></i>
                              Suppression...
                            </>
                          ) : (
                            <>
                              <i className="ti ti-trash mr-1"></i>
                              Supprimer
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions globales */}
            {sessions.length > 1 && (
              <div className="mt-6 pt-6 border-t border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium mb-1">Actions globales</h3>
                    <p className="text-gray-400 text-sm">
                      Gérer toutes vos sessions en une fois
                    </p>
                  </div>
                  <button
                    onClick={handleDeleteAllOtherSessions}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors flex items-center"
                  >
                    <i className="ti ti-trash mr-2"></i>
                    Supprimer toutes les autres sessions
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-gray-900 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <i className="ti ti-history mr-2"></i>
                Historique de visionnage ({historyTotal})
              </h2>
              <button
                onClick={() => fetchHistory()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors flex items-center"
              >
                <i className="ti ti-refresh mr-2"></i>
                Actualiser
              </button>
            </div>

            {historyLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-400 mt-2">Chargement de l'historique...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                <i className="ti ti-history text-4xl mb-4 block"></i>
                <p>Aucun historique de visionnage</p>
                <p className="text-sm mt-2">Commencez à regarder des films et séries pour voir votre historique ici.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item) => (
                  <div key={`${item.id}-${item.videoId}`} className="border border-gray-700 rounded-lg p-4 hover:bg-gray-800 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-16 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                            {item.contentType === 'MOVIE' ? (
                              <i className="ti ti-movie text-2xl text-gray-400"></i>
                            ) : (
                              <i className="ti ti-device-tv text-2xl text-gray-400"></i>
                            )}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-medium">
                            {item.contentType === 'MOVIE' ? 'Film' : 'Série'} #{item.contentId}
                            {item.videoId && <span className="text-gray-400 text-sm"> • Vidéo #{item.videoId}</span>}
                          </h3>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-400">
                          <span className="flex items-center">
                          <i className="ti ti-clock mr-1"></i>
                          Vu le {formatDate(item.watchedAt)}
                          </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            if (item.contentType === 'MOVIE') {
                              router.push(`/movies/${item.contentId}`);
                            } else {
                              router.push(`/series/${item.contentId}`);
                            }
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          Voir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {historyTotal > 20 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-gray-400 text-sm">
                  Affichage de {((historyPage - 1) * 20) + 1} à {Math.min(historyPage * 20, historyTotal)} sur {historyTotal} éléments
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setHistoryPage(prev => Math.max(1, prev - 1))}
                    disabled={historyPage === 1}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded text-sm transition-colors"
                  >
                    Précédent
                  </button>
                  <span className="text-gray-400 text-sm">
                    Page {historyPage} sur {Math.ceil(historyTotal / 20)}
                  </span>
                  <button
                    onClick={() => setHistoryPage(prev => prev + 1)}
                    disabled={historyPage >= Math.ceil(historyTotal / 20)}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded text-sm transition-colors"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Danger Zone */}
        <div className="mt-8 bg-red-900/20 border border-red-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-400 mb-4">Zone dangereuse</h2>
          <p className="text-gray-300 text-sm mb-4">
            Ces actions sont irréversibles. Soyez prudent.
          </p>
          <div className="flex space-x-4">
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Se déconnecter
            </button>
            <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors">
              Supprimer le compte
            </button>
          </div>
        </div>
      </div>
      <Analytics />
    </div>
  );
}
