'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  role: string;
}

export default function AuthBanner() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          cache: 'no-store', // Éviter le cache pour avoir les données les plus récentes
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUser(data.user);
            setIsVisible(false); // Utilisateur connecté, cacher le bandeau
          } else {
            setUser(null);
            setIsVisible(true); // Pas d'utilisateur, afficher le bandeau
          }
        } else {
          setUser(null);
          setIsVisible(true); // Erreur d'auth, afficher le bandeau
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
        setIsVisible(true); // Erreur, afficher le bandeau
      } finally {
        setIsLoading(false);
      }
    };

    // Vérification initiale
    checkAuth();

    // Re-vérification périodique pour s'assurer que l'état est à jour
    const interval = setInterval(checkAuth, 30000); // Vérifier toutes les 30 secondes

    // Re-vérifier l'auth quand l'utilisateur revient sur l'onglet
    const handleFocus = () => {
      checkAuth();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
  };

  // Ne pas afficher sur les pages d'authentification
  if (pathname.startsWith('/auth/')) {
    return null;
  }

  // Ne pas afficher si on charge, si l'utilisateur est connecté, ou si le bandeau n'est pas visible
  if (isLoading || user || !isVisible) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-sky-500 to-blue-600 text-white py-3 px-4 relative z-50">
      <div className="max-w-7xl mx-auto">
        {/* Version desktop */}
        <div className="hidden md:flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <i className="ti ti-lock text-xl"></i>
            <div>
              <p className="font-semibold text-sm">
                Connexion requise pour accéder au catalogue
              </p>
              <p className="text-xs opacity-90">
                Connectez-vous pour visionner tous nos films et séries
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Link 
              href="/auth/login"
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors backdrop-blur-sm"
            >
              Se connecter
            </Link>
            <Link 
              href="/auth/register"
              className="bg-white text-sky-600 hover:bg-gray-100 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              S'inscrire
            </Link>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white transition-colors p-1"
              aria-label="Fermer le bandeau"
            >
              <i className="ti ti-x text-lg"></i>
            </button>
          </div>
        </div>

        {/* Version mobile */}
        <div className="md:hidden">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2 flex-1">
              <i className="ti ti-lock text-lg"></i>
              <div className="flex-1">
                <p className="font-semibold text-sm">
                  Connexion requise
                </p>
                <p className="text-xs opacity-90">
                  Accédez au catalogue complet
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white transition-colors p-1 ml-2"
              aria-label="Fermer le bandeau"
            >
              <i className="ti ti-x text-lg"></i>
            </button>
          </div>
          
          <div className="flex space-x-2">
            <Link 
              href="/auth/login"
              className="flex-1 bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors backdrop-blur-sm text-center"
            >
              Se connecter
            </Link>
            <Link 
              href="/auth/register"
              className="flex-1 bg-white text-sky-600 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium transition-colors text-center"
            >
              S'inscrire
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
