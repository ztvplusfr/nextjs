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

// GET - Récupérer une vidéo par ID
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
    const videoId = parseInt(id);

    if (isNaN(videoId)) {
      return NextResponse.json(
        { error: 'ID de vidéo invalide' },
        { status: 400 }
      );
    }

    const video = await prisma.video.findUnique({
      where: { id: videoId },
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
    console.error('Admin video GET error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la vidéo' },
      { status: 500 }
    );
  }
}

// PUT - Modifier une vidéo
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
    const videoId = parseInt(id);

    if (isNaN(videoId)) {
      return NextResponse.json(
        { error: 'ID de vidéo invalide' },
        { status: 400 }
      );
    }

    const {
      title,
      embedUrl,
      quality,
      language,
      type,
      isActive
    } = await request.json();

    if (!title || !embedUrl || !type) {
      return NextResponse.json(
        { error: 'Le titre, l\'URL embed et le type sont requis' },
        { status: 400 }
      );
    }

    // Vérifier que la vidéo existe
    const existingVideo = await prisma.video.findUnique({
      where: { id: videoId }
    });

    if (!existingVideo) {
      return NextResponse.json(
        { error: 'Vidéo non trouvée' },
        { status: 404 }
      );
    }

    const video = await prisma.video.update({
      where: { id: videoId },
      data: {
        title,
        embedUrl,
        quality,
        language,
        type,
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
      message: 'Vidéo modifiée avec succès'
    }, { status: 200 });

  } catch (error) {
    console.error('Admin video PUT error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la modification de la vidéo' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une vidéo
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
    const videoId = parseInt(id);

    if (isNaN(videoId)) {
      return NextResponse.json(
        { error: 'ID de vidéo invalide' },
        { status: 400 }
      );
    }

    // Vérifier que la vidéo existe
    const existingVideo = await prisma.video.findUnique({
      where: { id: videoId }
    });

    if (!existingVideo) {
      return NextResponse.json(
        { error: 'Vidéo non trouvée' },
        { status: 404 }
      );
    }

    await prisma.video.delete({
      where: { id: videoId }
    });

    return NextResponse.json({
      success: true,
      message: 'Vidéo supprimée avec succès'
    }, { status: 200 });

  } catch (error) {
    console.error('Admin video DELETE error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la vidéo' },
      { status: 500 }
    );
  }
}
