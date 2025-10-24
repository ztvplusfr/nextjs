'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Analytics } from "@vercel/analytics/next";

interface PasswordReset {
  id: number;
  email: string;
  createdAt: string;
  expiresAt: string;
  active: boolean;
}

export default function PasswordResetsAdminPage() {
  const [resets, setResets] = useState<PasswordReset[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchResets();
  }, []);

  const fetchResets = async () => {
    try {
      const response = await fetch('/api/admin/password-resets');
      const data = await response.json();

      if (data.success) {
        setResets(data.data);
      } else {
        setError('Erreur lors du chargement des demandes');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const activateReset = async (id: number) => {
    setActivating(id);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/admin/password-resets/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Ajouter le token d'authentification admin
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Demande activée avec succès');
        setResetUrl(data.resetUrl);
        // Actualiser la liste
        await fetchResets();
      } else {
        setError(data.error || 'Erreur lors de l\'activation');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setActivating(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  const isExpired = (expiresAt: string | null) => {
    return expiresAt ? new Date() > new Date(expiresAt) : false;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Demandes de réinitialisation</h1>
          <button
            onClick={() => router.back()}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
          >
            Retour
          </button>
        </div>

        {message && (
        <div className="bg-green-900/50 border border-green-500 text-green-400 px-4 py-3 rounded mb-6">
            <div>{message}</div>
            {resetUrl && (
              <div className="mt-3">
                <div className="text-sm font-medium mb-2">Lien de réinitialisation :</div>
                <div className="bg-black/50 p-3 rounded text-xs font-mono break-all border">
                  <a
                    href={resetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-400 hover:text-sky-300 underline"
                  >
                    {resetUrl}
                  </a>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(resetUrl)}
                  className="mt-2 bg-sky-600 hover:bg-sky-700 text-white px-3 py-1 rounded text-xs transition-colors"
                >
                  📋 Copier le lien
                </button>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-400 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Créé le
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Expire le
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {resets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-400">
                      Aucune demande en attente
                    </td>
                  </tr>
                ) : (
                  resets.map((reset) => (
                    <tr key={reset.id} className="hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{reset.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          {formatDate(reset.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${isExpired(reset.expiresAt) ? 'text-red-400' : 'text-gray-300'}`}>
                          {reset.expiresAt ? (
                            <>
                              {formatDate(reset.expiresAt)}
                              {isExpired(reset.expiresAt) && (
                                <span className="ml-2 text-xs bg-red-900 px-2 py-1 rounded">EXPIRÉ</span>
                              )}
                            </>
                          ) : (
                            <span className="text-yellow-400">En attente d'activation</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          reset.active
                            ? 'bg-green-900 text-green-400'
                            : 'bg-yellow-900 text-yellow-400'
                        }`}>
                          {reset.active ? 'Activé' : 'En attente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {!reset.active && !isExpired(reset.expiresAt) && (
                          <button
                            onClick={() => activateReset(reset.id)}
                            disabled={activating === reset.id}
                            className="bg-sky-600 hover:bg-sky-700 text-white px-3 py-1 rounded text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {activating === reset.id ? 'Activation...' : 'Activer'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Informations</h2>
          <div className="space-y-2 text-sm text-gray-300">
            <p>• Les tokens expirent automatiquement après 5 minutes</p>
            <p>• Seuls les tokens activés peuvent être utilisés pour la réinitialisation</p>
            <p>• Les tokens utilisés ou expirés sont automatiquement supprimés</p>
            <p>• Un utilisateur ne peut avoir qu'un seul token actif à la fois</p>
          </div>
        </div>
      </div>
      <Analytics />
    </div>
  );
}
