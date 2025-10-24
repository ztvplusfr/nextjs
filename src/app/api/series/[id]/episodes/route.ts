import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const seriesId = parseInt(id);

    if (isNaN(seriesId)) {
      return NextResponse.json(
        { success: false, message: 'ID de série invalide' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const seasonNumber = searchParams.get('season');
    const episodeNumber = searchParams.get('episode');

    // Construire la requête de base
    let whereClause: any = {
      season: {
        series: {
          id: seriesId,
        },
      },
      isActive: true,
    };

    // Ajouter les filtres si fournis
    if (seasonNumber) {
      whereClause.season.number = parseInt(seasonNumber);
    }

    if (episodeNumber) {
      whereClause.number = parseInt(episodeNumber);
    }

    const episodes = await prisma.episode.findMany({
      where: whereClause,
      include: {
        season: {
          select: {
            id: true,
            number: true,
            series: {
              select: {
                id: true,
                title: true,
                poster: true,
              },
            },
          },
        },
        videos: {
          where: { isActive: true },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: [
        { season: { number: 'asc' } },
        { number: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: episodes,
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des épisodes:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
