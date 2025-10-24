import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export async function GET(request: NextRequest) {
  try {
    // S'assurer que Prisma est connecté// Récupérer les derniers épisodes qui ont des vidéos
    const episodes = await prisma.episode.findMany({
      where: {
        videos: {
          some: {}
        }
      },
      select: {
        id: true,
        title: true,
        stillPath: true,
        rating: true,
        duration: true,
        number: true,
        season: {
          select: {
            number: true,
            series: {
              select: {
                id: true,
                title: true,
                poster: true
              }
            }
          }
        },
        videos: {
          select: {
            id: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    // Transformer les données pour le format attendu
    const formattedEpisodes = episodes.map(episode => ({
      id: episode.id,
      title: episode.title,
      poster: episode.season.series.poster,
      stillPath: episode.stillPath,
      rating: episode.rating,
      duration: episode.duration,
      seasonNumber: episode.season.number,
      episodeNumber: episode.number,
      seriesTitle: episode.season.series.title,
      seriesId: episode.season.series.id,
      videos: episode.videos
    }));

    return NextResponse.json({
      success: true,
      data: formattedEpisodes
    });

  } catch (error) {
    console.error('Erreur lors du chargement des derniers épisodes:', error);
    return NextResponse.json({
      success: false,
      message: 'Erreur serveur'
    }, { status: 500 });
  }
}
