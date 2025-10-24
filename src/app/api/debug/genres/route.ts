import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export async function GET() {
  try {
    // S'assurer que Prisma est connecté// Récupérer tous les genres
    const genres = await prisma.genre.findMany({
      select: {
        id: true,
        name: true,
        slug: true
      }
    });

    // Récupérer toutes les relations MovieGenre
    const movieGenres = await prisma.movieGenre.findMany({
      include: {
        movie: {
          select: {
            id: true,
            title: true
          }
        },
        genre: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Récupérer tous les films avec leurs genres
    const movies = await prisma.movie.findMany({
      include: {
        genres: {
          include: {
            genre: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        genres,
        movieGenres,
        movies: movies.map(movie => ({
          id: movie.id,
          title: movie.title,
          genres: movie.genres.map(mg => mg.genre.name)
        }))
      }
    });

  } catch (error) {
    console.error('Erreur debug genres:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
