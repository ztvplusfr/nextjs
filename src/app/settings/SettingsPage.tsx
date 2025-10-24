'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

const TIMEZONES = [
  { value: 'Europe/Paris', label: 'Paris (France métropolitaine)' },
  { value: 'Europe/Brussels', label: 'Bruxelles (Belgique)' },
  { value: 'Indian/Mayotte', label: 'Mayotte' },
  { value: 'Indian/Mauritius', label: 'Maurice (Île Maurice)' },
  { value: 'Indian/Reunion', label: 'Réunion' }
];

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    timezone: TIMEZONES[0].value
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Vérification de l'authentification
  useEffect(() => {
    const checkAuth = async () => {
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
        setFormData({
          timezone: data.user.timezone || 'Europe/Paris'
        });
        setIsLoading(false);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/auth/login');
      }
    };

    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setMessage('Paramètres mis à jour avec succès !');
        // Recharger les informations utilisateur
        const authResponse = await fetch('/api/auth/me', {
          credentials: 'include',
        });
        if (authResponse.ok) {
          const data = await authResponse.json();
          setUser(data.user);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Update failed:', error);
      setError('Erreur de connexion');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Paramètres</h1>
          <p className="text-gray-400">
            Gérez vos préférences et paramètres de compte.
          </p>
        </div>

        <div className="space-y-6">
          {/* Messages de succès/erreur */}
          {message && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center">
                <i className="ti ti-check-circle text-green-500 mr-3"></i>
                <span className="text-green-400">{message}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <div className="flex items-center">
                <i className="ti ti-alert-circle text-red-500 mr-3"></i>
                <span className="text-red-400">{error}</span>
              </div>
            </div>
          )}

          {/* Section fuseau horaire */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <i className="ti ti-clock text-blue-400 text-xl"></i>
              </div>
              <div>
                <h3 className="text-xl font-semibold">Fuseau horaire</h3>
                <p className="text-gray-400 text-sm">
                  Choisissez votre fuseau horaire pour afficher les dates correctement.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="timezone" className="block text-sm font-medium text-gray-300 mb-2">
                  Fuseau horaire
                </label>
                <select
                  id="timezone"
                  value={formData.timezone}
                  onChange={(e) => handleInputChange('timezone', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  Actuellement : {formData.timezone}
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Sauvegarde...</span>
                    </>
                  ) : (
                    <>
                      <i className="ti ti-device-floppy"></i>
                      <span>Sauvegarder</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Aperçu des dates */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <i className="ti ti-calendar text-green-400 text-xl"></i>
              </div>
              <div>
                <h3 className="text-xl font-semibold">Aperçu des dates</h3>
                <p className="text-gray-400 text-sm">
                  Voici comment les dates s'afficheront avec votre fuseau horaire.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <span className="text-gray-300">Date actuelle :</span>
                <span className="font-mono text-sm">
                  {new Date().toLocaleString('fr-FR', {
                    timeZone: formData.timezone,
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <span className="text-gray-300">Format court :</span>
                <span className="font-mono text-sm">
                  {new Date().toLocaleDateString('fr-FR', {
                    timeZone: formData.timezone,
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
