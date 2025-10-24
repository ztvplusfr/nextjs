import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
// GET - Récupérer une vidéo spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; episodeId: string; videoId: string }> }
) {
  try {
    const { id, episodeId: episodeIdParam, videoId: videoIdParam } = await params;
    const seriesId = parseInt(id);
    const episodeId = parseInt(episodeIdParam);
    const videoId = parseInt(videoIdParam);

    if (isNaN(seriesId) || isNaN(episodeId) || isNaN(videoId)) {
      return NextResponse.json(
        { success: false, error: 'IDs invalides' },
        { status: 400 }
      );
    }

    const video = await prisma.video.findFirst({
      where: {
        id: videoId,
        episodeId: episodeId,
        episode: {
          season: {
            series: {
              id: seriesId,
            },
          },
        },
      },
    });

    if (!video) {
      return NextResponse.json(
        { success: false, error: 'Vidéo non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: video,
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la vidéo:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour une vidéo
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; episodeId: string; videoId: string }> }
) {
  try {
    const { id, episodeId: episodeIdParam, videoId: videoIdParam } = await params;
    const seriesId = parseInt(id);
    const episodeId = parseInt(episodeIdParam);
    const videoId = parseInt(videoIdParam);

    if (isNaN(seriesId) || isNaN(episodeId) || isNaN(videoId)) {
      return NextResponse.json(
        { success: false, error: 'IDs invalides' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, embedUrl, quality, language, type } = body;

    // Vérifier que la vidéo existe
    const existingVideo = await prisma.video.findFirst({
      where: {
        id: videoId,
        episodeId: episodeId,
        episode: {
          season: {
            series: {
              id: seriesId,
            },
          },
        },
      },
    });

    if (!existingVideo) {
      return NextResponse.json(
        { success: false, error: 'Vidéo non trouvée' },
        { status: 404 }
      );
    }

    // Mettre à jour la vidéo
    const updatedVideo = await prisma.video.update({
      where: {
        id: videoId,
      },
      data: {
        title: title || '',
        embedUrl: embedUrl,
        quality: quality || null,
        language: language || 'fr',
        type: type || 'EPISODE',
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedVideo,
      message: 'Vidéo mise à jour avec succès',
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de la vidéo:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une vidéo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; episodeId: string; videoId: string }> }
) {
  try {
    const { id, episodeId: episodeIdParam, videoId: videoIdParam } = await params;
    const seriesId = parseInt(id);
    const episodeId = parseInt(episodeIdParam);
    const videoId = parseInt(videoIdParam);

    if (isNaN(seriesId) || isNaN(episodeId) || isNaN(videoId)) {
      return NextResponse.json(
        { success: false, error: 'IDs invalides' },
        { status: 400 }
      );
    }

    // Vérifier que la vidéo existe
    const existingVideo = await prisma.video.findFirst({
      where: {
        id: videoId,
        episodeId: episodeId,
        episode: {
          season: {
            series: {
              id: seriesId,
            },
          },
        },
      },
    });

    if (!existingVideo) {
      return NextResponse.json(
        { success: false, error: 'Vidéo non trouvée' },
        { status: 404 }
      );
    }

    // Supprimer la vidéo
    await prisma.video.delete({
      where: {
        id: videoId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Vidéo supprimée avec succès',
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de la vidéo:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
