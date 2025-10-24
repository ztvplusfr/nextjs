import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { contentId, contentType, videoId } = await request.json();

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

    if (!contentId || !contentType) {
      return NextResponse.json(
        { success: false, error: 'contentId et contentType requis' },
        { status: 400 }
      );
    }

    if (!['MOVIE', 'SERIES'].includes(contentType)) {
      return NextResponse.json(
        { success: false, error: 'contentType doit être MOVIE ou SERIES' },
        { status: 400 }
      );
    }

    // Créer ou mettre à jour l'entrée d'historique
    const history = await prisma.history.upsert({
      where: {
        userId_contentId_contentType_videoId: {
          userId,
          contentId,
          contentType: contentType as 'MOVIE' | 'SERIES',
          videoId: videoId || null
        }
      },
      update: {
        watchedAt: new Date()
      },
      create: {
        userId,
        contentId,
        contentType: contentType as 'MOVIE' | 'SERIES',
        videoId: videoId || null
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Historique enregistré',
      data: history
    });

  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de l\'historique:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
