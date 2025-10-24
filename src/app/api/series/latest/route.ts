import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const latestSeries = await prisma.series.findMany({
      where: {
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
        createdAt: 'desc',
      },
      take: limit,
    });

    // Formater les données
    const formattedSeries = latestSeries.map(series => ({
      ...series,
      genres: series.genres.map(sg => sg.genre.name)
    }));

    return NextResponse.json({
      success: true,
      data: formattedSeries,
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des dernières séries:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération des dernières séries' 
      },
      { status: 500 }
    );
  }
}
