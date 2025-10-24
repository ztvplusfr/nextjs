import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
// GET - Récupérer une saison spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; seasonId: string }> }
) {
  try {
    const { id, seasonId: seasonIdParam } = await params;
    const seriesId = parseInt(id);
    const seasonId = parseInt(seasonIdParam);

    if (isNaN(seriesId) || isNaN(seasonId)) {
      return NextResponse.json(
        { success: false, error: 'IDs invalides' },
        { status: 400 }
      );
    }

    const season = await prisma.season.findFirst({
      where: {
        id: seasonId,
        seriesId: seriesId,
      },
      include: {
        series: {
          select: {
            id: true,
            title: true,
          },
        },
        episodes: {
          orderBy: {
            number: 'asc',
          },
        },
      },
    });

    if (!season) {
      return NextResponse.json(
        { success: false, error: 'Saison non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: season,
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la saison:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour une saison
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; seasonId: string }> }
) {
  try {
    const { id, seasonId: seasonIdParam } = await params;
    const seriesId = parseInt(id);
    const seasonId = parseInt(seasonIdParam);

    if (isNaN(seriesId) || isNaN(seasonId)) {
      return NextResponse.json(
        { success: false, error: 'IDs invalides' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, description, poster, airDate } = body;

    // Vérifier que la saison existe
    const existingSeason = await prisma.season.findFirst({
      where: {
        id: seasonId,
        seriesId: seriesId,
      },
    });

    if (!existingSeason) {
      return NextResponse.json(
        { success: false, error: 'Saison non trouvée' },
        { status: 404 }
      );
    }

    // Mettre à jour la saison
    const updatedSeason = await prisma.season.update({
      where: {
        id: seasonId,
      },
      data: {
        title: title || null,
        description: description || null,
        poster: poster || null,
        airDate: airDate ? new Date(airDate) : null,
      },
      include: {
        series: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedSeason,
      message: 'Saison mise à jour avec succès',
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de la saison:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une saison
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; seasonId: string }> }
) {
  try {
    const { id, seasonId: seasonIdParam } = await params;
    const seriesId = parseInt(id);
    const seasonId = parseInt(seasonIdParam);

    if (isNaN(seriesId) || isNaN(seasonId)) {
      return NextResponse.json(
        { success: false, error: 'IDs invalides' },
        { status: 400 }
      );
    }

    // Vérifier que la saison existe
    const existingSeason = await prisma.season.findFirst({
      where: {
        id: seasonId,
        seriesId: seriesId,
      },
    });

    if (!existingSeason) {
      return NextResponse.json(
        { success: false, error: 'Saison non trouvée' },
        { status: 404 }
      );
    }

    // Supprimer la saison (les épisodes seront supprimés en cascade)
    await prisma.season.delete({
      where: {
        id: seasonId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Saison supprimée avec succès',
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de la saison:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
