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

// GET - Récupérer toutes les vidéos d'un film
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
    const movieId = parseInt(id);

    if (isNaN(movieId)) {
      return NextResponse.json(
        { error: 'ID de film invalide' },
        { status: 400 }
      );
    }

    // Vérifier que le film existe
    const movie = await prisma.movie.findUnique({
      where: { id: movieId }
    });

    if (!movie) {
      return NextResponse.json(
        { error: 'Film non trouvé' },
        { status: 404 }
      );
    }

    // Récupérer les vidéos du film
    const videos = await prisma.video.findMany({
      where: { 
        movieId: movieId,
        type: 'MOVIE'
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: videos
    }, { status: 200 });

  } catch (error) {
    console.error('Admin movie videos GET error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des vidéos du film' },
      { status: 500 }
    );
  }
}

// POST - Ajouter une vidéo à un film
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await checkAdminAuth(request);
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { id } = await params;
    const movieId = parseInt(id);

    if (isNaN(movieId)) {
      return NextResponse.json(
        { error: 'ID de film invalide' },
        { status: 400 }
      );
    }

    const {
      title,
      embedUrl,
      quality,
      language,
      isActive
    } = await request.json();

    if (!title || !embedUrl) {
      return NextResponse.json(
        { error: 'Le titre et l\'URL embed sont requis' },
        { status: 400 }
      );
    }

    // Vérifier que le film existe
    const movie = await prisma.movie.findUnique({
      where: { id: movieId }
    });

    if (!movie) {
      return NextResponse.json(
        { error: 'Film non trouvé' },
        { status: 404 }
      );
    }

    // Créer la vidéo
    const video = await prisma.video.create({
      data: {
        title,
        embedUrl,
        quality: quality || null,
        language: language || 'FR',
        type: 'MOVIE',
        movieId: movieId,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    return NextResponse.json({
      success: true,
      data: video,
      message: 'Vidéo ajoutée avec succès'
    }, { status: 201 });

  } catch (error) {
    console.error('Admin movie video POST error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'ajout de la vidéo' },
      { status: 500 }
    );
  }
}
