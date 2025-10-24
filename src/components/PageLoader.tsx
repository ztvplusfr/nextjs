'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Loader from './Loader';

interface PageLoaderProps {
  children: React.ReactNode;
}

export default function PageLoader({ children }: PageLoaderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadedComponents, setLoadedComponents] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    // Afficher le loader lors du changement d'URL
    setIsLoading(true);
    setLoadedComponents(0);
    
    // Précharger toutes les APIs en parallèle
    const preloadAPIs = async () => {
      const apiCalls = [
        fetch('/api/featured').catch(err => {
          console.warn('Featured API error:', err);
          return { ok: false, error: err };
        }),
        fetch('/api/movies/latest').catch(err => {
          console.warn('Latest movies API error:', err);
          return { ok: false, error: err };
        }),
        fetch('/api/series/latest').catch(err => {
          console.warn('Latest series API error:', err);
          return { ok: false, error: err };
        }),
        fetch('/api/movies/top10').catch(err => {
          console.warn('Top10 movies API error:', err);
          return { ok: false, error: err };
        }),
        fetch('/api/series/top10').catch(err => {
          console.warn('Top10 series API error:', err);
          return { ok: false, error: err };
        }),
        fetch('/api/genres').catch(err => {
          console.warn('Genres API error:', err);
          return { ok: false, error: err };
        }),
        fetch('/api/auth/me').catch(err => {
          console.warn('Auth API error:', err);
          return { ok: false, error: err };
        })
      ];

      try {
        // Attendre que toutes les APIs soient chargées (même en cas d'erreur)
        const results = await Promise.allSettled(apiCalls);
        
        // Log des erreurs pour debug
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.warn(`API ${index} failed:`, result.reason);
          }
        });
        
        // Simuler un délai minimum pour une meilleure UX
        await new Promise(resolve => setTimeout(resolve, 300));
        
        setIsLoading(false);
      } catch (error) {
        console.error('Erreur lors du préchargement:', error);
        // Même en cas d'erreur, continuer après un délai
        setTimeout(() => setIsLoading(false), 500);
      }
    };

    preloadAPIs();
  }, [pathname]);

  const handleComponentLoad = () => {
    setLoadedComponents(prev => prev + 1);
  };

  return (
    <>
      <Loader isLoading={isLoading} />
      {!isLoading && children}
    </>
  );
}
