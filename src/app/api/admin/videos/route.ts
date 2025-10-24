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
    const type = searchParams.get('type') || '';
    const movieId = searchParams.get('movieId') || '';
    const episodeId = searchParams.get('episodeId') || '';

    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }
    if (type) {
      where.type = type;
    }
    if (movieId) {
      where.movieId = parseInt(movieId);
    }
    if (episodeId) {
      where.episodeId = parseInt(episodeId);
    }

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where,
        include: {
          movie: true,
          episode: {
            include: {
              season: {
                include: {
                  series: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.video.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: videos,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Admin videos GET error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des vidéos' },
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
      title,
      embedUrl,
      quality,
      language,
      type,
      movieId,
      episodeId,
      isActive
    } = await request.json();

    if (!title || !embedUrl || !type) {
      return NextResponse.json(
        { error: 'Le titre, l\'URL embed et le type sont requis' },
        { status: 400 }
      );
    }

    // Vérifier que soit movieId soit episodeId est fourni selon le type
    if (type === 'MOVIE' && !movieId) {
      return NextResponse.json(
        { error: 'L\'ID du film est requis pour une vidéo de film' },
        { status: 400 }
      );
    }

    if (type === 'EPISODE' && !episodeId) {
      return NextResponse.json(
        { error: 'L\'ID de l\'épisode est requis pour une vidéo d\'épisode' },
        { status: 400 }
      );
    }

    // Vérifier que le film ou l'épisode existe
    if (movieId) {
      const movie = await prisma.movie.findUnique({
        where: { id: parseInt(movieId) }
      });
      if (!movie) {
        return NextResponse.json(
          { error: 'Film non trouvé' },
          { status: 404 }
        );
      }
    }

    if (episodeId) {
      const episode = await prisma.episode.findUnique({
        where: { id: parseInt(episodeId) }
      });
      if (!episode) {
        return NextResponse.json(
          { error: 'Épisode non trouvé' },
          { status: 404 }
        );
      }
    }

    const video = await prisma.video.create({
      data: {
        title,
        embedUrl,
        quality,
        language,
        type,
        movieId: movieId ? parseInt(movieId) : null,
        episodeId: episodeId ? parseInt(episodeId) : null,
        isActive: isActive !== undefined ? isActive : true
      },
      include: {
        movie: true,
        episode: {
          include: {
            season: {
              include: {
                series: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({ 
      success: true,
      data: video,
      message: 'Vidéo créée avec succès'
    }, { status: 201 });

  } catch (error) {
    console.error('Admin videos POST error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la vidéo' },
      { status: 500 }
    );
  }
}
