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

export async function GET(request: NextRequest) {
  try {
    const authCheck = await checkAdminAuth(request);
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const featured = searchParams.get('featured') || '';

    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { originalTitle: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (category) {
      where.categoryId = parseInt(category);
    }
    if (featured === 'true') {
      where.isFeatured = true;
    }

    const [series, total] = await Promise.all([
      prisma.series.findMany({
        where,
        include: {
          category: true,
          genres: {
            include: { genre: true }
          },
          seasons: {
            include: {
              episodes: {
                include: { videos: true }
              }
            }
          },
          _count: {
            select: { 
              seasons: true,
              genres: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.series.count({ where })
    ]);

    return NextResponse.json({
      series,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Admin series GET error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des séries' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await checkAdminAuth(request);
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const {
      tmdbId,
      title,
      originalTitle,
      description,
      year,
      rating,
      voteCount,
      popularity,
      poster,
      backdrop,
      trailer,
      adult,
      originalLanguage,
      firstAirDate,
      lastAirDate,
      numberOfSeasons,
      numberOfEpisodes,
      status,
      categoryId,
      genreIds,
      isActive,
      isFeatured
    } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: 'Le titre est requis' },
        { status: 400 }
      );
    }

    // Vérifier si tmdbId existe déjà
    if (tmdbId) {
      const existingSeries = await prisma.series.findUnique({
        where: { tmdbId }
      });

      if (existingSeries) {
        return NextResponse.json(
          { error: 'Une série avec cet ID TMDB existe déjà' },
          { status: 400 }
        );
      }
    }

    const series = await prisma.series.create({
      data: {
        tmdbId,
        title,
        originalTitle,
        description,
        year,
        rating,
        voteCount,
        popularity,
        poster,
        backdrop,
        trailer,
        adult: adult || false,
        originalLanguage,
        firstAirDate: firstAirDate ? new Date(firstAirDate) : null,
        lastAirDate: lastAirDate ? new Date(lastAirDate) : null,
        numberOfSeasons,
        numberOfEpisodes,
        status,
        categoryId: categoryId ? parseInt(categoryId) : null,
        isActive: isActive !== undefined ? isActive : true,
        isFeatured: isFeatured || false
      },
      include: {
        category: true,
        genres: {
          include: { genre: true }
        }
      }
    });

    // Ajouter les genres si fournis
    if (genreIds && genreIds.length > 0) {
      await prisma.seriesGenre.createMany({
        data: genreIds.map((genreId: number) => ({
          seriesId: series.id,
          genreId
        }))
      });
    }

    return NextResponse.json({ series }, { status: 201 });

  } catch (error) {
    console.error('Admin series POST error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la série' },
      { status: 500 }
    );
  }
}
