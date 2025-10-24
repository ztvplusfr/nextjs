import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const movieId = parseInt(id);

    if (isNaN(movieId)) {
      return NextResponse.json(
        { success: false, error: 'ID de film invalide' },
        { status: 400 }
      );
    }

    // Récupérer le film actuel pour obtenir ses genres
    const currentMovie = await prisma.movie.findUnique({
      where: { id: movieId },
      select: {
        genres: {
          select: {
            genreId: true,
          },
        },
      },
    });

    if (!currentMovie) {
      return NextResponse.json(
        { success: false, error: 'Film non trouvé' },
        { status: 404 }
      );
    }

    // Récupérer les IDs des genres du film actuel
    const currentGenreIds = currentMovie.genres.map(g => g.genreId);

    if (currentGenreIds.length === 0) {
      // Si pas de genres, retourner des films aléatoires
      const randomMovies = await prisma.movie.findMany({
        where: {
          isActive: true,
          id: { not: movieId }
        },
        select: {
          id: true,
          title: true,
          poster: true,
          year: true,
          rating: true,
        },
        orderBy: {
          popularity: 'desc'
        },
        take: 10,
      });

      return NextResponse.json({
        success: true,
        data: randomMovies,
      });
    }

    // Récupérer les films avec des genres similaires
    const similarMovies = await prisma.movie.findMany({
      where: {
        isActive: true,
        id: { not: movieId },
        genres: {
          some: {
            genreId: {
              in: currentGenreIds
            }
          }
        }
      },
      select: {
        id: true,
        title: true,
        poster: true,
        year: true,
        rating: true,
        genres: {
          select: {
            genreId: true,
          },
        },
      },
      orderBy: {
        popularity: 'desc'
      },
      take: 20,
    });

    // Trier par nombre de genres en commun
    const sortedMovies = similarMovies.sort((a, b) => {
      const aCommonGenres = a.genres.filter(g => currentGenreIds.includes(g.genreId)).length;
      const bCommonGenres = b.genres.filter(g => currentGenreIds.includes(g.genreId)).length;
      return bCommonGenres - aCommonGenres;
    });

    // Retourner les 10 premiers
    const result = sortedMovies.slice(0, 10).map(movie => ({
      id: movie.id,
      title: movie.title,
      poster: movie.poster,
      year: movie.year,
      rating: movie.rating,
    }));

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des films similaires:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération des films similaires' 
      },
      { status: 500 }
    );
  }
}
