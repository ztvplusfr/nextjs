import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export async function GET(request: NextRequest) {
  try {
    // S'assurer que Prisma est connecté// Récupérer les films en vedette
    const featuredMovies = await prisma.movie.findMany({
      where: {
        isFeatured: true,
        isActive: true,
      },
      select: {
        id: true,
        title: true,
        originalTitle: true,
        description: true,
        year: true,
        rating: true,
        duration: true,
        poster: true,
        backdrop: true,
        trailer: true,
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
          where: { isActive: true }
        },
      },
      orderBy: {
        popularity: 'desc',
      },
      take: 10,
    });

    // Récupérer les séries en vedette
    const featuredSeries = await prisma.series.findMany({
      where: {
        isFeatured: true,
        isActive: true,
      },
      select: {
        id: true,
        title: true,
        originalTitle: true,
        description: true,
        year: true,
        rating: true,
        poster: true,
        backdrop: true,
        trailer: true,
        firstAirDate: true,
        numberOfSeasons: true,
        numberOfEpisodes: true,
        status: true,
        genres: {
          include: {
            genre: {
              select: {
                name: true,
              },
            },
          },
        },
        seasons: {
          where: { isActive: true },
          include: {
            episodes: {
              where: { isActive: true },
              include: {
                videos: {
                  where: { isActive: true }
                }
              }
            }
          }
        },
      },
      orderBy: {
        popularity: 'desc',
      },
      take: 10,
    });

    // Combiner et mélanger le contenu
    const allFeatured = [
      ...featuredMovies.map(movie => ({
        ...movie,
        type: 'movie' as const,
        genres: movie.genres.map(g => g.genre.name),
      })),
      ...featuredSeries.map(series => ({
        ...series,
        type: 'series' as const,
        genres: series.genres.map(g => g.genre.name),
      })),
    ];

    // Mélanger aléatoirement
    const shuffled = allFeatured.sort(() => Math.random() - 0.5);

    return NextResponse.json({
      success: true,
      data: shuffled,
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du contenu en vedette:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération du contenu en vedette' 
      },
      { status: 500 }
    );
  }
}
