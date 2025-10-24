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

// GET - Récupérer une vidéo spécifique d'un film
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; videoId: string }> }
) {
  try {
    const authCheck = await checkAdminAuth(request);
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { id, videoId } = await params;
    const movieId = parseInt(id);
    const videoIdInt = parseInt(videoId);

    if (isNaN(movieId) || isNaN(videoIdInt)) {
      return NextResponse.json(
        { error: 'IDs invalides' },
        { status: 400 }
      );
    }

    // Vérifier que la vidéo appartient au film
    const video = await prisma.video.findFirst({
      where: { 
        id: videoIdInt,
        movieId: movieId,
        type: 'MOVIE'
      }
    });

    if (!video) {
      return NextResponse.json(
        { error: 'Vidéo non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: video
    }, { status: 200 });

  } catch (error) {
    console.error('Admin movie video GET error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la vidéo' },
      { status: 500 }
    );
  }
}

// PUT - Modifier une vidéo d'un film
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; videoId: string }> }
) {
  try {
    const authCheck = await checkAdminAuth(request);
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { id, videoId } = await params;
    const movieId = parseInt(id);
    const videoIdInt = parseInt(videoId);

    if (isNaN(movieId) || isNaN(videoIdInt)) {
      return NextResponse.json(
        { error: 'IDs invalides' },
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

    // Vérifier que la vidéo appartient au film
    const existingVideo = await prisma.video.findFirst({
      where: { 
        id: videoIdInt,
        movieId: movieId,
        type: 'MOVIE'
      }
    });

    if (!existingVideo) {
      return NextResponse.json(
        { error: 'Vidéo non trouvée' },
        { status: 404 }
      );
    }

    // Mettre à jour la vidéo
    const video = await prisma.video.update({
      where: { id: videoIdInt },
      data: {
        title,
        embedUrl,
        quality: quality || null,
        language: language || 'FR',
        isActive: isActive !== undefined ? isActive : true
      }
    });

    return NextResponse.json({
      success: true,
      data: video,
      message: 'Vidéo modifiée avec succès'
    }, { status: 200 });

  } catch (error) {
    console.error('Admin movie video PUT error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la modification de la vidéo' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une vidéo d'un film
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; videoId: string }> }
) {
  try {
    const authCheck = await checkAdminAuth(request);
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { id, videoId } = await params;
    const movieId = parseInt(id);
    const videoIdInt = parseInt(videoId);

    if (isNaN(movieId) || isNaN(videoIdInt)) {
      return NextResponse.json(
        { error: 'IDs invalides' },
        { status: 400 }
      );
    }

    // Vérifier que la vidéo appartient au film
    const existingVideo = await prisma.video.findFirst({
      where: { 
        id: videoIdInt,
        movieId: movieId,
        type: 'MOVIE'
      }
    });

    if (!existingVideo) {
      return NextResponse.json(
        { error: 'Vidéo non trouvée' },
        { status: 404 }
      );
    }

    // Supprimer la vidéo
    await prisma.video.delete({
      where: { id: videoIdInt }
    });

    return NextResponse.json({
      success: true,
      message: 'Vidéo supprimée avec succès'
    }, { status: 200 });

  } catch (error) {
    console.error('Admin movie video DELETE error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la vidéo' },
      { status: 500 }
    );
  }
}
