'use client';

import { useEffect, useRef, useState } from 'react';

interface ArtPlayerProps {
  url: string | null;
  title?: string;
  poster?: string;
  autoplay?: boolean;
  muted?: boolean;
  volume?: number;
  onReady?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (error: any) => void;
  className?: string;
}

declare global {
  interface Window {
    Artplayer: any;
  }
}

export default function ArtPlayer({
  url,
  title = 'Vidéo',
  poster,
  autoplay = false,
  muted = false,
  volume = 0.7,
  onReady,
  onPlay,
  onPause,
  onEnded,
  onError,
  className = ''
}: ArtPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setError('URL de vidéo manquante');
      setIsLoading(false);
      return;
    }

    const loadArtPlayer = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Charger ArtPlayer depuis le CDN
        if (!window.Artplayer) {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/artplayer/dist/artplayer.js';
          script.onload = () => {
            initializePlayer();
          };
          script.onerror = () => {
            setError('Erreur lors du chargement d\'ArtPlayer');
            setIsLoading(false);
          };
          document.head.appendChild(script);
        } else {
          initializePlayer();
        }
      } catch (err) {
        console.error('Erreur lors du chargement d\'ArtPlayer:', err);
        setError('Erreur lors du chargement du lecteur');
        setIsLoading(false);
      }
    };

    loadArtPlayer();

    const initializePlayer = () => {
      if (!containerRef.current || !window.Artplayer) return;

      try {
        // Détruire l'ancien player s'il existe
        if (playerRef.current) {
          playerRef.current.destroy();
        }

        // Créer le nouveau player
        playerRef.current = new window.Artplayer({
          container: containerRef.current,
          url: url,
          title: title,
          poster: poster,
          autoplay: autoplay,
          muted: muted,
          volume: volume,
          theme: '#f00',
          isLive: false,
          loop: false,
          playbackRate: true,
          aspectRatio: true,
          screenshot: true,
          setting: true,
          hotkey: true,
          pip: true,
          mutex: true,
          backdrop: true,
          fullscreen: true,
          fullscreenWeb: true,
          subtitleOffset: true,
          miniProgressBar: true,
          useSSR: false,
          playsInline: true,
          lock: false,
          gesture: true,
          fastForward: true,
          autoPlayback: true,
          autoOrientation: true,
          airplay: true,
          moreVideoAttr: {
            controls: false,
            preload: 'metadata'
          },
          layers: [
            {
              name: 'loading',
              html: `
                <div class="art-loading">
                  <div class="art-loading-spinner"></div>
                </div>
              `,
              style: {
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10
              }
            }
          ],
          controls: [
            {
              name: 'play',
              position: 'left'
            },
            {
              name: 'volume',
              position: 'left'
            },
            {
              name: 'time',
              position: 'left'
            },
            {
              name: 'progress',
              position: 'center'
            },
            {
              name: 'setting',
              position: 'right'
            },
            {
              name: 'fullscreen',
              position: 'right'
            }
          ],
          settings: [
            {
              name: 'quality',
              html: 'Qualité',
              selector: [
                { default: true, html: 'Auto', url: url }
              ]
            },
            {
              name: 'playbackRate',
              html: 'Vitesse',
              selector: [
                { default: true, html: '1x', value: 1 },
                { html: '1.25x', value: 1.25 },
                { html: '1.5x', value: 1.5 },
                { html: '2x', value: 2 }
              ]
            }
          ],
          i18n: {
            'fr-FR': {
              'Play': 'Lire',
              'Pause': 'Pause',
              'Mute': 'Muet',
              'Unmute': 'Son',
              'Volume': 'Volume',
              'Fullscreen': 'Plein écran',
              'Exit Fullscreen': 'Quitter le plein écran',
              'Screenshot': 'Capture d\'écran',
              'Playback Rate': 'Vitesse de lecture',
              'Quality': 'Qualité',
              'Settings': 'Paramètres',
              'Close': 'Fermer',
              'Loading': 'Chargement...',
              'Error': 'Erreur',
              'Retry': 'Réessayer'
            }
          }
        });

        // Événements du player
        playerRef.current.on('ready', () => {
          setIsLoading(false);
          onReady?.();
        });

        playerRef.current.on('play', () => {
          onPlay?.();
        });

        playerRef.current.on('pause', () => {
          onPause?.();
        });

        playerRef.current.on('ended', () => {
          onEnded?.();
        });

        playerRef.current.on('error', (error: any) => {
          console.error('Erreur du player:', error);
          setError('Erreur de lecture vidéo');
          onError?.(error);
        });

        // Gestion des erreurs de chargement
        playerRef.current.on('video:error', (error: any) => {
          console.error('Erreur vidéo:', error);
          setError('Impossible de charger la vidéo');
          onError?.(error);
        });

      } catch (err) {
        console.error('Erreur lors de l\'initialisation du player:', err);
        setError('Erreur lors de l\'initialisation du lecteur');
        setIsLoading(false);
      }
    };

    loadArtPlayer();

    // Cleanup
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (err) {
          console.error('Erreur lors de la destruction du player:', err);
        }
      }
    };
  }, [url, title, poster, autoplay, muted, volume]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-black text-white ${className}`}>
        <div className="text-center p-8">
          <div className="text-red-500 text-6xl mb-4">
            <i className="ti ti-alert-circle"></i>
          </div>
          <h3 className="text-xl font-semibold mb-2">Erreur de lecture</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <i className="ti ti-refresh mr-2"></i>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-black ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-white text-lg">Chargement du lecteur...</p>
          </div>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
