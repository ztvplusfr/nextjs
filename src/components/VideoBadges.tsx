'use client';

interface VideoBadgesProps {
  video: {
    id: number;
    title: string;
    quality?: string;
    language: string;
    type: string;
  };
  className?: string;
}

export default function VideoBadges({ video, className = '' }: VideoBadgesProps) {
  const getLanguageName = (language: string) => {
    const languageMap: { [key: string]: string } = {
      'fr': 'Français',
      'en': 'Anglais',
      'es': 'Espagnol',
      'de': 'Allemand',
      'it': 'Italien',
      'pt': 'Portugais',
      'ru': 'Russe',
      'ja': 'Japonais',
      'ko': 'Coréen',
      'zh': 'Chinois',
      'ar': 'Arabe',
      'hi': 'Hindi',
      'nl': 'Néerlandais',
      'sv': 'Suédois',
      'no': 'Norvégien',
      'da': 'Danois',
      'fi': 'Finnois',
      'pl': 'Polonais',
      'tr': 'Turc',
      'th': 'Thaï',
      'vi': 'Vietnamien',
      'id': 'Indonésien',
      'ms': 'Malais',
      'tl': 'Tagalog'
    };
    
    return languageMap[language.toLowerCase()] || language.toUpperCase();
  };


  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* Badge Titre de la vidéo */}
      <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded flex items-center space-x-1">
        <i className="ti ti-video text-xs"></i>
        <span className="font-medium line-clamp-1 max-w-24">{video.title}</span>
      </span>

      {/* Badge Qualité */}
      {video.quality && (
        <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded flex items-center space-x-1">
          <i className="ti ti-badge-hd text-xs"></i>
          <span className="font-medium">{video.quality}</span>
        </span>
      )}

      {/* Badge Langue */}
      <span className="bg-green-600 text-white text-xs px-2 py-1 rounded flex items-center space-x-1">
        <i className="ti ti-language text-xs"></i>
        <span className="font-medium">{getLanguageName(video.language)}</span>
      </span>

      {/* Badge Type */}
      <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded flex items-center space-x-1">
        <i className="ti ti-tag text-xs"></i>
        <span className="font-medium">{video.type}</span>
      </span>
    </div>
  );
}
