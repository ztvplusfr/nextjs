import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
import jwt from 'jsonwebtoken';


// Middleware pour vérifier les permissions admin
async function checkAdminAuth(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) {
    return { error: 'Non authentifié', status: 401 };
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
  } catch (error) {
    return { error: 'Token invalide', status: 401 };
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { role: true }
  });

  if (!user || user.role !== 'ADMIN') {
    return { error: 'Accès refusé. Droits administrateur requis.', status: 403 };
  }

  return { userId: decoded.userId };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await checkAdminAuth(request);
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { id } = await params;
    const seriesId = parseInt(id);

    if (isNaN(seriesId)) {
      return NextResponse.json(
        { success: false, error: 'ID de série invalide' },
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
          include: {
            episodes: {
              include: { videos: true }
            }
          },
          orderBy: { number: 'asc' }
        }
      },
    });

    if (!series) {
      return NextResponse.json(
        { success: false, error: 'Série non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: series,
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la série:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération de la série' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await checkAdminAuth(request);
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { id } = await params;
    const seriesId = parseInt(id);

    if (isNaN(seriesId)) {
      return NextResponse.json(
        { success: false, error: 'ID de série invalide' },
        { status: 400 }
      );
    }

    const {
      title,
      originalTitle,
      description,
      year,
      rating,
      poster,
      backdrop,
      trailer,
      firstAirDate,
      lastAirDate,
      numberOfSeasons,
      numberOfEpisodes,
      status,
      isActive,
      isFeatured,
      genres
    } = await request.json();

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Le titre est requis' },
        { status: 400 }
      );
    }

    // Vérifier si la série existe
    const existingSeries = await prisma.series.findUnique({
      where: { id: seriesId }
    });

    if (!existingSeries) {
      return NextResponse.json(
        { success: false, error: 'Série non trouvée' },
        { status: 404 }
      );
    }

    // Mettre à jour la série
    const updatedSeries = await prisma.series.update({
      where: { id: seriesId },
      data: {
        title,
        originalTitle,
        description,
        year: year ? parseInt(year) : null,
        rating: rating ? Math.round(parseFloat(rating) * 10) / 10 : null,
        poster,
        backdrop,
        trailer,
        firstAirDate: firstAirDate ? new Date(firstAirDate) : null,
        lastAirDate: lastAirDate ? new Date(lastAirDate) : null,
        numberOfSeasons: numberOfSeasons ? parseInt(numberOfSeasons) : null,
        numberOfEpisodes: numberOfEpisodes ? parseInt(numberOfEpisodes) : null,
        status,
        isActive: isActive !== undefined ? isActive : true,
        isFeatured: isFeatured || false,
        updatedAt: new Date()
      },
      include: {
        genres: {
          include: {
            genre: true
          }
        },
        category: true
      }
    });

    // Mettre à jour les genres si fournis
    if (genres && Array.isArray(genres)) {
      // Supprimer les anciens genres
      await prisma.seriesGenre.deleteMany({
        where: { seriesId: seriesId }
      });

      // Ajouter les nouveaux genres
      if (genres.length > 0) {
        await prisma.seriesGenre.createMany({
          data: genres.map((genreId: number) => ({
            seriesId: seriesId,
            genreId: genreId
          }))
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Série mise à jour avec succès',
      data: updatedSeries
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de la série:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la mise à jour de la série' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await checkAdminAuth(request);
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { id } = await params;
    const seriesId = parseInt(id);

    if (isNaN(seriesId)) {
      return NextResponse.json(
        { success: false, error: 'ID de série invalide' },
        { status: 400 }
      );
    }

    // Vérifier si la série existe
    const existingSeries = await prisma.series.findUnique({
      where: { id: seriesId }
    });

    if (!existingSeries) {
      return NextResponse.json(
        { success: false, error: 'Série non trouvée' },
        { status: 404 }
      );
    }

    // Supprimer la série (les saisons et épisodes seront supprimés automatiquement via les relations)
    await prisma.series.delete({
      where: { id: seriesId }
    });

    return NextResponse.json({
      success: true,
      message: 'Série supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de la série:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la suppression de la série' 
      },
      { status: 500 }
    );
  }
}
