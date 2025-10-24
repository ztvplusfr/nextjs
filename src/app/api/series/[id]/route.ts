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

    const series = await prisma.series.findUnique({
      where: { id: seriesId },
      include: {
        genres: {
          include: {
            genre: true
          }
        },
        category: true,
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
        }
      }
    });

    if (!series) {
      return NextResponse.json(
        { success: false, message: 'Série non trouvée' },
        { status: 404 }
      );
    }

    // Formater les données
    const formattedSeries = {
      ...series,
      genres: series.genres.map(sg => sg.genre.name)
    };

    return NextResponse.json({
      success: true,
      data: formattedSeries
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la série:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
