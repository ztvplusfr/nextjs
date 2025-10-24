import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


export async function GET(request: NextRequest) {
  try {
    
    // Récupérer les 10 derniers films sortis
    const latestMovies = await prisma.movie.findMany({
      where: {
        isActive: true,
        releaseDate: { not: null }
      },
      select: {
        id: true,
        title: true,
        poster: true,
        year: true,
        rating: true,
        duration: true,
        releaseDate: true,
        genres: {
          include: {
            genre: {
              select: {
                name: true,
              },
            },
          },
        },
        videos: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        releaseDate: 'desc'
      },
      take: 10,
    });

    // Formater les données pour inclure les noms des genres
    const formattedMovies = latestMovies.map(movie => ({
      ...movie,
      genres: movie.genres.map(mg => mg.genre.name)
    }));

    return NextResponse.json({
      success: true,
      data: formattedMovies,
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des derniers films:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération des derniers films' 
      },
      { status: 500 }
    );
  }
}
