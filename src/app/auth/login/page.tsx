'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Analytics } from "@vercel/analytics/next";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [sessionLimitReached, setSessionLimitReached] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSessionLimitReached(false);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailOrUsername: formData.emailOrUsername,
          password: formData.password,
        }),
      });

      // Vérifier si la réponse est OK
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Vérifier si la réponse a du contenu
      const text = await response.text();
      if (!text) {
        throw new Error('Réponse vide du serveur');
      }

      const data = JSON.parse(text);

      if (response.ok) {
        alert('Connexion réussie! Redirection vers l\'accueil...');
        // Redirection vers la page d'accueil
        router.push('/');
      } else {
        
        // Vérifier si c'est une erreur de limite de sessions
        if (data.sessionLimit) {
          setSessionLimitReached(true);
        } else {
          alert(`Erreur: ${data.error}`);
        }
      }
    } catch (error) {
      console.error('Network error:', error);
      alert('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
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
        alert(`Toutes les autres sessions ont été supprimées (${data.deletedCount} sessions supprimées) ! Vous pouvez maintenant vous reconnecter.`);
        setSessionLimitReached(false);
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error}`);
      }
    } catch (error) {
      console.error('Sessions deletion failed:', error);
      alert('Erreur lors de la suppression des sessions');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-6 md:mb-8">
          <img 
            src="https://res.cloudinary.com/dp98soedn/image/upload/v1761251325/logo_ajahwp.png"
            alt="ZTV+ Logo" 
            className="w-24 h-24 md:w-32 md:h-32 object-contain mx-auto mb-4 md:mb-6"
          />
          
          <h1 className="text-xl md:text-3xl font-bold text-white mb-2">
            Connectez-vous à votre compte ZTVPlus
          </h1>
        </div>

        {/* Login Form */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 md:p-6">
          {/* Message de limite de sessions */}
          {sessionLimitReached && (
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <i className="ti ti-alert-triangle text-yellow-400 text-xl mt-0.5"></i>
                <div>
                  <h3 className="text-yellow-400 font-medium mb-1">Limite de sessions atteinte</h3>
                  <p className="text-yellow-200 text-sm mb-3">
                    Vous avez déjà 4 sessions actives. Pour vous connecter, vous devez d'abord 
                    supprimer une session existante depuis votre compte.
                  </p>
                  <div className="flex justify-end">
                    <button
                      onClick={() => setSessionLimitReached(false)}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email or Username Field */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Email ou nom d&apos;utilisateur
              </label>
              <input
                type="text"
                name="emailOrUsername"
                value={formData.emailOrUsername}
                onChange={handleChange}
                required
                className="w-full px-3 py-3 md:py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base md:text-sm"
                placeholder="votre@email.com ou nom_utilisateur"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-3 py-3 md:py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base md:text-sm"
                placeholder="••••••••"
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm gap-2">
              <label className="flex items-center text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  className="mr-2 w-4 h-4 bg-gray-800 border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                Se souvenir de moi
              </label>

              <a href="/forgot-password" className="text-blue-400 hover:text-blue-300 text-center sm:text-right">
                Mot de passe oublié ?
              </a>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 md:py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base md:text-sm"
            >
              {isLoading ? 'Connexion...' : "Se connecter"}
            </button>

            {/* Connexion via web Button */}
            <button
              type="button"
              onClick={() => {
                // Ouvrir une nouvelle fenêtre pour la connexion web
                window.open('/auth/web-login', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
              }}
              className="w-full py-3 md:py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded transition-colors text-base md:text-sm"
            >
              <i className="ti ti-world mr-2"></i>
              Connexion via web
            </button>
          </form>

          {/* Sign Up Section */}
          <div className="mt-4 md:mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Nouveau sur ZTV+ ?{' '}
              <a href="/auth/register" className="text-blue-400 hover:text-blue-300">
                Créer un compte
              </a>
            </p>
          </div>
        </div>
      </div>
      <Analytics />
    </div>
  );
}
