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
    const seasonId = searchParams.get('seasonId') || '';
    const seriesId = searchParams.get('seriesId') || '';

    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }
    if (seasonId) {
      where.seasonId = parseInt(seasonId);
    }
    if (seriesId) {
      where.season = {
        seriesId: parseInt(seriesId)
      };
    }

    const [episodes, total] = await Promise.all([
      prisma.episode.findMany({
        where,
        include: {
          season: {
            include: {
              series: true
            }
          },
          videos: true,
          _count: {
            select: { videos: true }
          }
        },
        orderBy: [
          { season: { number: 'asc' } },
          { number: 'asc' }
        ],
        skip,
        take: limit
      }),
      prisma.episode.count({ where })
    ]);

    return NextResponse.json({
      episodes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Admin episodes GET error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des épisodes' },
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
      number,
      title,
      description,
      duration,
      airDate,
      rating,
      voteCount,
      stillPath,
      seasonId,
      isActive
    } = await request.json();

    if (!title || !number || !seasonId) {
      return NextResponse.json(
        { error: 'Le titre, le numéro et la saison sont requis' },
        { status: 400 }
      );
    }

    // Vérifier si tmdbId existe déjà
    if (tmdbId) {
      const existingEpisode = await prisma.episode.findUnique({
        where: { tmdbId }
      });

      if (existingEpisode) {
        return NextResponse.json(
          { error: 'Un épisode avec cet ID TMDB existe déjà' },
          { status: 400 }
        );
      }
    }

    // Vérifier si le numéro d'épisode existe déjà dans cette saison
    const existingEpisodeNumber = await prisma.episode.findFirst({
      where: {
        seasonId: parseInt(seasonId),
        number: parseInt(number)
      }
    });

    if (existingEpisodeNumber) {
      return NextResponse.json(
        { error: 'Un épisode avec ce numéro existe déjà dans cette saison' },
        { status: 400 }
      );
    }

    const episode = await prisma.episode.create({
      data: {
        tmdbId,
        number: parseInt(number),
        title,
        description,
        duration,
        airDate: airDate ? new Date(airDate) : null,
        rating,
        voteCount,
        stillPath,
        seasonId: parseInt(seasonId),
        isActive: isActive !== undefined ? isActive : true
      },
      include: {
        season: {
          include: {
            series: true
          }
        }
      }
    });

    return NextResponse.json({ episode }, { status: 201 });

  } catch (error) {
    console.error('Admin episodes POST error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'épisode' },
      { status: 500 }
    );
  }
}
