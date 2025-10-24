import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const movieId = parseInt(resolvedParams.id);
    
    if (isNaN(movieId)) {
      return {
        title: 'Film — ZTVPlus',
        description: 'Découvrez ce film sur ZTVPlus. Regardez en streaming haute qualité avec votre plateforme préférée.',
      };
    }

    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
      select: {
        title: true,
        description: true,
        year: true,
        rating: true,
        poster: true,
        backdrop: true,
        genres: {
          select: {
            genre: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    if (!movie) {
      return {
        title: 'Film — ZTVPlus',
        description: 'Découvrez ce film sur ZTVPlus. Regardez en streaming haute qualité avec votre plateforme préférée.',
      };
    }

    const genreNames = movie.genres.map(g => g.genre.name).join(', ');
    const title = `${movie.title}${movie.year ? ` (${movie.year})` : ''} — ZTVPlus`;
    const description = movie.description 
      ? `${movie.description.substring(0, 150)}... Regardez ${movie.title} en streaming sur ZTVPlus.`
      : `Regardez ${movie.title} en streaming haute qualité sur ZTVPlus. ${movie.year ? `Sorti en ${movie.year}.` : ''} ${genreNames ? `Genres: ${genreNames}.` : ''}`;

    return {
      title,
      description,
      keywords: [
        movie.title,
        'streaming',
        'film',
        'ZTVPlus',
        ...(movie.year ? [movie.year.toString()] : []),
        ...(genreNames ? genreNames.split(', ') : [])
      ],
      openGraph: {
        title,
        description,
        type: 'video.movie',
        images: movie.poster ? [
          {
            url: movie.poster.startsWith('http') 
              ? movie.poster 
              : `https://image.tmdb.org/t/p/w500${movie.poster}`,
            width: 500,
            height: 750,
            alt: `${movie.title} poster`,
          }
        ] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: movie.poster ? [
          movie.poster.startsWith('http') 
            ? movie.poster 
            : `https://image.tmdb.org/t/p/w500${movie.poster}`
        ] : [],
      },
    };
  } catch (error) {
    console.error('Error generating metadata for movie:', error);
    return {
      title: 'Film — ZTVPlus',
      description: 'Découvrez ce film sur ZTVPlus. Regardez en streaming haute qualité avec votre plateforme préférée.',
    };
  }
}

export default function MovieDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
