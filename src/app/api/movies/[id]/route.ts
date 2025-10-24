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
        { success: false, message: 'ID de film invalide' },
        { status: 400 }
      );
    }

    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
      include: {
        genres: {
          include: {
            genre: true
          }
        },
        category: true,
        videos: {
          where: { isActive: true }
        }
      }
    });

    if (!movie) {
      return NextResponse.json(
        { success: false, message: 'Film non trouvé' },
        { status: 404 }
      );
    }

    // Formater les données
    const formattedMovie = {
      ...movie,
      genres: movie.genres.map(mg => mg.genre.name)
    };

    return NextResponse.json({
      success: true,
      data: formattedMovie
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du film:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}