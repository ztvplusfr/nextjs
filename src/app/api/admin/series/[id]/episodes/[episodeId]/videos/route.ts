import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
// GET - Récupérer toutes les vidéos d'un épisode
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; episodeId: string }> }
) {
  try {
    const { id, episodeId: episodeIdParam } = await params;
    const seriesId = parseInt(id);
    const episodeId = parseInt(episodeIdParam);

    if (isNaN(seriesId) || isNaN(episodeId)) {
      return NextResponse.json(
        { success: false, error: 'IDs invalides' },
        { status: 400 }
      );
    }

    const videos = await prisma.video.findMany({
      where: {
        episodeId: episodeId,
        episode: {
          season: {
            series: {
              id: seriesId,
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: videos,
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des vidéos:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Ajouter une vidéo à un épisode
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; episodeId: string }> }
) {
  try {
    const { id, episodeId: episodeIdParam } = await params;
    const seriesId = parseInt(id);
    const episodeId = parseInt(episodeIdParam);

    if (isNaN(seriesId) || isNaN(episodeId)) {
      return NextResponse.json(
        { success: false, error: 'IDs invalides' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, embedUrl, quality, language, type } = body;

    // Vérifier que l'épisode existe
    const existingEpisode = await prisma.episode.findFirst({
      where: {
        id: episodeId,
        season: {
          series: {
            id: seriesId,
          },
        },
      },
    });

    if (!existingEpisode) {
      return NextResponse.json(
        { success: false, error: 'Épisode non trouvé' },
        { status: 404 }
      );
    }

    // Créer la vidéo
    const newVideo = await prisma.video.create({
      data: {
        title: title || '',
        embedUrl: embedUrl,
        quality: quality || null,
        language: language || 'fr',
        type: type || 'EPISODE',
        episodeId: episodeId,
      },
    });

    return NextResponse.json({
      success: true,
      data: newVideo,
      message: 'Vidéo ajoutée avec succès',
    });

  } catch (error) {
    console.error('Erreur lors de l\'ajout de la vidéo:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
