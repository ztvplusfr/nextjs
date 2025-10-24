'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Analytics } from "@vercel/analytics/next";
import ArtPlayer from '@/components/ArtPlayer';

export default function TestPlayerPage() {
  const router = useRouter();
  const [testUrl, setTestUrl] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
  const [customUrl, setCustomUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);

  const testVideos = [
    {
      title: 'Big Buck Bunny',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      poster: 'https://peach.blender.org/wp-content/uploads/poster_bunny.jpg'
    },
    {
      title: 'Elephant Dream',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      poster: 'https://download.blender.org/ED/ED_1080p.jpg'
    },
    {
      title: 'For Bigger Blazes',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      poster: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg'
    },
    {
      title: 'For Bigger Escape',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      poster: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg'
    },
    {
      title: 'For Bigger Fun',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      poster: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerFun.jpg'
    }
  ];

  const handleVideoSelect = (video: typeof testVideos[0]) => {
    setTestUrl(video.url);
    setIsPlaying(true);
  };

  const handleCustomUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customUrl.trim()) {
      setTestUrl(customUrl.trim());
      setIsPlaying(true);
    }
  };

  const handlePlayerReady = () => {
    console.log('Player is ready');
  };

  const handlePlayerPlay = () => {
    console.log('Player started playing');
  };

  const handlePlayerPause = () => {
    console.log('Player paused');
  };

  const handlePlayerError = (error: any) => {
    console.error('Player error:', error);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors"
          >
            <i className="ti ti-arrow-left mr-2"></i>
            Retour
          </button>
          <h1 className="text-white text-xl font-bold">Test ArtPlayer</h1>
          <div></div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)]">
        {/* Player Section */}
        <div className="flex-1 bg-black p-4">
          <div className="h-full">
            <h2 className="text-white text-lg font-semibold mb-4">Lecteur ArtPlayer</h2>
            <div className="h-[calc(100%-60px)] bg-black rounded-lg overflow-hidden">
              <ArtPlayer
                url={testUrl}
                title="Test Video"
                poster={testVideos.find(v => v.url === testUrl)?.poster}
                autoplay={false}
                muted={false}
                volume={0.7}
                onReady={handlePlayerReady}
                onPlay={handlePlayerPlay}
                onPause={handlePlayerPause}
                onError={handlePlayerError}
                className="w-full h-full"
              />
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="w-full lg:w-80 bg-gray-800 border-t lg:border-l border-gray-700 p-4 overflow-y-auto">
          <h3 className="text-white text-lg font-semibold mb-4">Vidéos de test</h3>
          
          {/* Test Videos */}
          <div className="space-y-3 mb-6">
            <h4 className="text-gray-300 text-sm font-medium">Vidéos d'exemple</h4>
            {testVideos.map((video, index) => (
              <button
                key={index}
                onClick={() => handleVideoSelect(video)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  testUrl === video.url
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-8 bg-gray-600 rounded flex items-center justify-center">
                    <i className="ti ti-play text-xs"></i>
                  </div>
                  <div className="flex-1">
                    <h5 className="font-medium text-sm line-clamp-1">{video.title}</h5>
                    <p className="text-xs text-gray-400 line-clamp-1">Vidéo de test</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Custom URL */}
          <div className="space-y-3">
            <h4 className="text-gray-300 text-sm font-medium">URL personnalisée</h4>
            <form onSubmit={handleCustomUrlSubmit} className="space-y-3">
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://example.com/video.mp4"
                className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!customUrl.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors text-sm"
              >
                Charger la vidéo
              </button>
            </form>
          </div>

          {/* Player Info */}
          <div className="mt-6 p-4 bg-gray-700 rounded-lg">
            <h4 className="text-gray-300 text-sm font-medium mb-3">Informations du lecteur</h4>
            <div className="space-y-2 text-xs text-gray-400">
              <div className="flex justify-between">
                <span>URL:</span>
                <span className="text-white truncate ml-2">{testUrl}</span>
              </div>
              <div className="flex justify-between">
                <span>État:</span>
                <span className="text-white">{isPlaying ? 'En cours' : 'Arrêté'}</span>
              </div>
              <div className="flex justify-between">
                <span>Lecteur:</span>
                <span className="text-white">ArtPlayer</span>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mt-6 p-4 bg-gray-700 rounded-lg">
            <h4 className="text-gray-300 text-sm font-medium mb-3">Fonctionnalités</h4>
            <div className="space-y-2 text-xs text-gray-400">
              <div className="flex items-center">
                <i className="ti ti-check text-green-400 mr-2"></i>
                <span>Contrôles de lecture</span>
              </div>
              <div className="flex items-center">
                <i className="ti ti-check text-green-400 mr-2"></i>
                <span>Gestion du volume</span>
              </div>
              <div className="flex items-center">
                <i className="ti ti-check text-green-400 mr-2"></i>
                <span>Plein écran</span>
              </div>
              <div className="flex items-center">
                <i className="ti ti-check text-green-400 mr-2"></i>
                <span>Raccourcis clavier</span>
              </div>
              <div className="flex items-center">
                <i className="ti ti-check text-green-400 mr-2"></i>
                <span>Paramètres de qualité</span>
              </div>
              <div className="flex items-center">
                <i className="ti ti-check text-green-400 mr-2"></i>
                <span>Vitesse de lecture</span>
              </div>
              <div className="flex items-center">
                <i className="ti ti-check text-green-400 mr-2"></i>
                <span>Capture d'écran</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Analytics />
    </div>
  );
}
