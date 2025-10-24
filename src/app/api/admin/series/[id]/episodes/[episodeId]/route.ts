import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
// GET - Récupérer un épisode spécifique
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

    const episode = await prisma.episode.findFirst({
      where: {
        id: episodeId,
        season: {
          series: {
            id: seriesId,
          },
        },
      },
      include: {
        season: {
          select: {
            id: true,
            number: true,
            series: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        videos: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!episode) {
      return NextResponse.json(
        { success: false, error: 'Épisode non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: episode,
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'épisode:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour un épisode
export async function PUT(
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
    const { title, description, duration, airDate, rating, stillPath } = body;

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

    // Mettre à jour l'épisode
    const updatedEpisode = await prisma.episode.update({
      where: {
        id: episodeId,
      },
      data: {
        title: title || '',
        description: description || null,
        duration: duration || null,
        airDate: airDate ? new Date(airDate) : null,
        rating: rating || null,
        stillPath: stillPath || null,
      },
      include: {
        season: {
          select: {
            id: true,
            number: true,
            series: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        videos: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedEpisode,
      message: 'Épisode mis à jour avec succès',
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'épisode:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un épisode
export async function DELETE(
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

    // Supprimer l'épisode
    await prisma.episode.delete({
      where: {
        id: episodeId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Épisode supprimé avec succès',
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'épisode:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
