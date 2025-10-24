'use client';

import { useState, useEffect } from 'react';

interface LoaderProps {
  isLoading?: boolean;
}

export default function Loader({ isLoading = true }: LoaderProps) {
  const [showLoader, setShowLoader] = useState(isLoading);

  useEffect(() => {
    if (!isLoading) {
      // Délai réduit pour une réponse plus rapide
      const timer = setTimeout(() => {
        setShowLoader(false);
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setShowLoader(true);
    }
  }, [isLoading]);

  if (!showLoader) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200 ${
      isLoading ? 'opacity-100' : 'opacity-0'
    }`}>
      {/* Fond noir */}
      <div className="absolute inset-0 bg-black"></div>
      
      {/* Loader fin et rapide */}
      <div
        className="w-20 h-20 border-4 border-gray-500 border-t-blue-400 rounded-full animate-spin"
        style={{
          borderTopColor: 'var(--color-primary)',
          animation: 'spin 0.6s linear infinite'
        }}
      ></div>
    </div>
  );
}
