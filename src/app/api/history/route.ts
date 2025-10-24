import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const sessionToken = request.cookies.get('session-token')?.value;
    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Trouver la session
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true }
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Session expirée' },
        { status: 401 }
      );
    }

    const userId = session.userId;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Récupérer l'historique de base
    const historyData = await (prisma as any).history.findMany({
      where: { userId },
      orderBy: { watchedAt: 'desc' },
      take: limit,
      skip: offset
    });

    // Transformer les données pour inclure les informations de navigation
    const formattedHistory = await Promise.all(
      historyData.map(async (item: any) => {
        let navigationUrl = '';

        let videoDetails: any = null;

        if (item.videoId) {
          videoDetails = await (prisma as any).video.findUnique({
            where: { id: item.videoId },
            include: {
              episode: {
                include: {
                  season: true
                }
              }
            }
          });
        }

        if (item.contentType === 'MOVIE') {
          navigationUrl = `/watch/movie/${item.contentId}/${item.videoId}`;
        } else {
          // Pour les séries, récupérer les détails de l'épisode
          if (videoDetails?.episode) {
            navigationUrl = `/watch/series/${item.contentId}/${videoDetails.episode.season.number}/${videoDetails.episode.number}/${item.videoId}`;
          } else {
            navigationUrl = `/watch/series/${item.contentId}/1/1/${item.videoId}`; // fallback
          }
        }

        return {
          ...item,
          navigationUrl,
          video: videoDetails ? {
            id: videoDetails.id,
            title: videoDetails.title,
            quality: videoDetails.quality,
            language: videoDetails.language,
            type: videoDetails.type
          } : null
        };
      })
    );

    // Compter le total
    const total = await (prisma as any).history.count({
      where: { userId }
    });

    return NextResponse.json({
      success: true,
      data: formattedHistory,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
