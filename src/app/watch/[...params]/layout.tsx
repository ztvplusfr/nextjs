import { Metadata } from 'next';
import { generateMovieSEO, generateSeriesSEO, generateDefaultSEO } from '@/lib/seo';

interface WatchParamsLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    params: string[];
  }>;
}

export async function generateMetadata({ params }: WatchParamsLayoutProps): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const pathArray = resolvedParams.params;
    
    if (pathArray.length < 2) {
      return generateDefaultSEO();
    }

    const [type, contentId, seasonNumber, episodeNumber] = pathArray;
    
    if (type === 'movie') {
      // Récupérer les données du film
      const movieId = parseInt(contentId);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/movies/${movieId}`, {
        cache: 'no-store'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const movieData = data.data;
          
          const movieSEOData = {
            id: movieData.id,
            title: movieData.title,
            description: movieData.description,
            year: movieData.year,
            rating: movieData.rating,
            duration: movieData.duration,
            poster: movieData.poster,
            backdrop: movieData.backdrop,
            genres: movieData.genres?.map((g: any) => ({ name: g.genre?.name || g.name || 'Inconnu' })) || []
          };
          
          const seoData = generateMovieSEO(movieSEOData);
          
          return {
            title: seoData.title,
            description: seoData.description,
            keywords: seoData.keywords.join(', '),
            openGraph: {
              title: seoData.openGraph.title,
              description: seoData.openGraph.description,
              type: seoData.openGraph.type,
              url: seoData.openGraph.url,
              siteName: seoData.openGraph.siteName,
              images: seoData.openGraph.images,
            },
            twitter: {
              card: seoData.twitter.card,
              title: seoData.twitter.title,
              description: seoData.twitter.description,
              images: seoData.twitter.images,
            },
            other: {
              'application/ld+json': JSON.stringify(seoData.jsonLd)
            }
          };
        }
      }
    } else if (type === 'series') {
      // Récupérer les données de l'épisode
      const seriesId = parseInt(contentId);
      const season = parseInt(seasonNumber);
      const episode = parseInt(episodeNumber);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/series/${seriesId}/episodes?season=${season}&episode=${episode}`, {
        cache: 'no-store'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.length > 0) {
          const episodeData = data.data[0];
          
          const seriesSEOData = {
            id: episodeData.season.series.id,
            title: episodeData.season.series.title,
            description: episodeData.description,
            year: episodeData.season.series.year,
            rating: episodeData.rating,
            poster: episodeData.season.series.poster,
            backdrop: episodeData.season.series.backdrop,
            genres: episodeData.season.series.genres?.map((g: any) => ({ name: g.genre?.name || g.name || 'Inconnu' })) || [],
            season: episodeData.season.number,
            episode: episodeData.number,
            episodeTitle: episodeData.title
          };
          
          const seoData = generateSeriesSEO(seriesSEOData);
          
          return {
            title: seoData.title,
            description: seoData.description,
            keywords: seoData.keywords.join(', '),
            openGraph: {
              title: seoData.openGraph.title,
              description: seoData.openGraph.description,
              type: seoData.openGraph.type,
              url: seoData.openGraph.url,
              siteName: seoData.openGraph.siteName,
              images: seoData.openGraph.images,
            },
            twitter: {
              card: seoData.twitter.card,
              title: seoData.twitter.title,
              description: seoData.twitter.description,
              images: seoData.twitter.images,
            },
            other: {
              'application/ld+json': JSON.stringify(seoData.jsonLd)
            }
          };
        }
      }
    }
  } catch (error) {
    console.error('Erreur lors de la génération des métadonnées:', error);
  }
  
  // Retourner les métadonnées par défaut en cas d'erreur
  const defaultSEO = generateDefaultSEO();
  return {
    title: defaultSEO.title,
    description: defaultSEO.description,
    keywords: defaultSEO.keywords.join(', '),
    openGraph: {
      title: defaultSEO.openGraph.title,
      description: defaultSEO.openGraph.description,
      type: defaultSEO.openGraph.type,
      url: defaultSEO.openGraph.url,
      siteName: defaultSEO.openGraph.siteName,
      images: defaultSEO.openGraph.images,
    },
    twitter: {
      card: defaultSEO.twitter.card,
      title: defaultSEO.twitter.title,
      description: defaultSEO.twitter.description,
      images: defaultSEO.twitter.images,
    },
    other: {
      'application/ld+json': JSON.stringify(defaultSEO.jsonLd)
    }
  };
}

export default function WatchParamsLayout({ children }: WatchParamsLayoutProps) {
  return children;
}