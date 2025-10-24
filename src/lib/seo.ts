// Utilitaires SEO pour ZTVPlus

export interface MovieSEOData {
  id: number;
  title: string;
  description?: string;
  year?: number;
  rating?: number;
  duration?: number;
  poster?: string;
  backdrop?: string;
  genres?: Array<{ name: string }>;
}

export interface SeriesSEOData {
  id: number;
  title: string;
  description?: string;
  year?: number;
  rating?: number;
  poster?: string;
  backdrop?: string;
  genres?: Array<{ name: string }>;
  season?: number;
  episode?: number;
  episodeTitle?: string;
}

export interface SEOData {
  title: string;
  description: string;
  keywords: string[];
  openGraph: {
    title: string;
    description: string;
    type: 'video.movie' | 'video.episode';
    url: string;
    siteName: string;
    images: Array<{
      url: string;
      width: number;
      height: number;
      alt: string;
    }>;
    video?: {
      duration?: number;
      releaseDate?: string;
    };
  };
  twitter: {
    card: 'summary_large_image';
    title: string;
    description: string;
    images: string[];
  };
  jsonLd: object;
}

/**
 * Génère les métadonnées SEO pour un film
 */
export function generateMovieSEO(movie: MovieSEOData, baseUrl: string = 'https://ztvplus.vercel.app'): SEOData {
  const title = `${movie.title} (${movie.year}) - Film en streaming | ZTVPlus`;
  const description = movie.description 
    ? `${movie.description.substring(0, 150)}... Regardez ${movie.title} en streaming haute qualité sur ZTVPlus.`
    : `Regardez ${movie.title} (${movie.year}) en streaming haute qualité sur ZTVPlus. Film complet disponible.`;
  
  const keywords = [
    movie.title,
    'film',
    'streaming',
    'gratuit',
    'ZTVPlus',
    movie.year?.toString() || '',
    ...(movie.genres?.map(g => g.name) || [])
  ].filter(Boolean);

  const posterUrl = movie.poster?.startsWith('http') 
    ? movie.poster 
    : `https://image.tmdb.org/t/p/w500${movie.poster}`;

  const backdropUrl = movie.backdrop?.startsWith('http')
    ? movie.backdrop
    : `https://image.tmdb.org/t/p/w1280${movie.backdrop}`;

  const url = `${baseUrl}/watch/movie/${movie.id}`;

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      type: 'video.movie',
      url,
      siteName: 'ZTVPlus',
      images: [
        {
          url: posterUrl || backdropUrl || 'https://res.cloudinary.com/dp98soedn/image/upload/v1761251325/logo_ajahwp.png',
          width: 500,
          height: 750,
          alt: `Affiche de ${movie.title}`
        }
      ],
      video: {
        duration: movie.duration,
        releaseDate: movie.year?.toString()
      }
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [posterUrl || backdropUrl || 'https://res.cloudinary.com/dp98soedn/image/upload/v1761251325/logo_ajahwp.png']
    },
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Movie',
      name: movie.title,
      description: movie.description,
      datePublished: movie.year?.toString(),
      duration: movie.duration ? `PT${movie.duration}M` : undefined,
      aggregateRating: movie.rating ? {
        '@type': 'AggregateRating',
        ratingValue: movie.rating,
        bestRating: 10,
        worstRating: 1
      } : undefined,
      image: posterUrl || backdropUrl,
      url,
      provider: {
        '@type': 'Organization',
        name: 'ZTVPlus',
        url: baseUrl
      }
    }
  };
}

/**
 * Génère les métadonnées SEO pour un épisode de série
 */
export function generateSeriesSEO(series: SeriesSEOData, baseUrl: string = 'https://ztvplus.vercel.app'): SEOData {
  const episodeInfo = series.season && series.episode 
    ? `Saison ${series.season}, Épisode ${series.episode}`
    : '';
  
  const title = `${series.title} - ${episodeInfo} | ZTVPlus`;
  const description = series.description 
    ? `${series.description.substring(0, 150)}... Regardez ${series.title} ${episodeInfo} en streaming sur ZTVPlus.`
    : `Regardez ${series.title} ${episodeInfo} en streaming haute qualité sur ZTVPlus.`;
  
  const keywords = [
    series.title,
    'série',
    'streaming',
    'gratuit',
    'ZTVPlus',
    series.year?.toString() || '',
    ...(series.genres?.map(g => g.name) || [])
  ].filter(Boolean);

  const posterUrl = series.poster?.startsWith('http') 
    ? series.poster 
    : `https://image.tmdb.org/t/p/w500${series.poster}`;

  const backdropUrl = series.backdrop?.startsWith('http')
    ? series.backdrop
    : `https://image.tmdb.org/t/p/w1280${series.backdrop}`;

  const url = `${baseUrl}/watch/series/${series.id}/${series.season}/${series.episode}`;

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      type: 'video.episode',
      url,
      siteName: 'ZTVPlus',
      images: [
        {
          url: posterUrl || backdropUrl || 'https://res.cloudinary.com/dp98soedn/image/upload/v1761251325/logo_ajahwp.png',
          width: 500,
          height: 750,
          alt: `Affiche de ${series.title}`
        }
      ],
      video: {
        releaseDate: series.year?.toString()
      }
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [posterUrl || backdropUrl || 'https://res.cloudinary.com/dp98soedn/image/upload/v1761251325/logo_ajahwp.png']
    },
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'TVEpisode',
      name: series.episodeTitle || `${series.title} - Épisode ${series.episode}`,
      description: series.description,
      datePublished: series.year?.toString(),
      partOfSeries: {
        '@type': 'TVSeries',
        name: series.title,
        description: series.description,
        image: posterUrl || backdropUrl
      },
      seasonNumber: series.season,
      episodeNumber: series.episode,
      image: posterUrl || backdropUrl,
      url,
      provider: {
        '@type': 'Organization',
        name: 'ZTVPlus',
        url: baseUrl
      }
    }
  };
}

/**
 * Génère les métadonnées SEO par défaut
 */
export function generateDefaultSEO(): SEOData {
  return {
    title: 'ZTVPlus - Films et Séries en Streaming',
    description: 'Regardez vos films et séries préférés en streaming haute qualité sur ZTVPlus. Catalogue complet et gratuit.',
    keywords: ['streaming', 'films', 'séries', 'gratuit', 'ZTVPlus'],
    openGraph: {
      title: 'ZTVPlus - Films et Séries en Streaming',
      description: 'Regardez vos films et séries préférés en streaming haute qualité sur ZTVPlus.',
      type: 'video.movie',
      url: 'https://ztvplus.vercel.app',
      siteName: 'ZTVPlus',
      images: [{
        url: 'https://res.cloudinary.com/dp98soedn/image/upload/v1761251325/logo_ajahwp.png',
        width: 500,
        height: 500,
        alt: 'ZTVPlus Logo'
      }]
    },
    twitter: {
      card: 'summary_large_image',
      title: 'ZTVPlus - Films et Séries en Streaming',
      description: 'Regardez vos films et séries préférés en streaming haute qualité sur ZTVPlus.',
      images: ['https://res.cloudinary.com/dp98soedn/image/upload/v1761251325/logo_ajahwp.png']
    },
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'ZTVPlus',
      description: 'Plateforme de streaming de films et séries',
      url: 'https://ztvplus.vercel.app'
    }
  };
}
