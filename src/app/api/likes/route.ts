import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Récupérer tous les likes d'un utilisateur
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const sessionToken = request.cookies.get('session-token')?.value;
    if (!sessionToken) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 });
    }

    // Trouver la session
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true }
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ success: false, message: 'Session expirée' }, { status: 401 });
    }

    // Récupérer tous les likes de l'utilisateur, triés par date de création (plus récent en premier)
    const likes = await prisma.like.findMany({
      where: {
        userId: session.userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: likes
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des likes:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Erreur serveur' 
    }, { status: 500 });
  }
}

// POST - Ajouter un like
export async function POST(request: NextRequest) {
  
  try {
    const { contentId, contentType } = await request.json();
    
    // Vérifier l'authentification
    const sessionToken = request.cookies.get('session-token')?.value;
    if (!sessionToken) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 });
    }

    // Trouver la session
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true }
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ success: false, message: 'Session expirée' }, { status: 401 });
    }

    // Vérifier si le like existe déjà
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_contentId_contentType: {
          userId: session.userId,
          contentId: parseInt(contentId),
          contentType: contentType.toUpperCase() as 'MOVIE' | 'SERIES'
        }
      }
    });

    if (existingLike) {
      return NextResponse.json({ success: false, message: 'Déjà liké' }, { status: 400 });
    }

    // Créer le like
    await prisma.like.create({
      data: {
        userId: session.userId,
        contentId: parseInt(contentId),
        contentType: contentType.toUpperCase() as 'MOVIE' | 'SERIES'
      }
    });

    // Compter le nombre total de likes
    const likeCount = await prisma.like.count({
      where: {
        contentId: parseInt(contentId),
        contentType: contentType.toUpperCase() as 'MOVIE' | 'SERIES'
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Like ajouté',
      data: { likeCount }
    });

  } catch (error) {
    console.error('Erreur lors de l\'ajout du like:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Erreur serveur' 
    }, { status: 500 });
  }
}

// DELETE - Supprimer un like
export async function DELETE(request: NextRequest) {
  
  try {
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');
    const contentType = searchParams.get('contentType');
    
    if (!contentId || !contentType) {
      return NextResponse.json({ success: false, message: 'Paramètres manquants' }, { status: 400 });
    }

    // Vérifier l'authentification
    const sessionToken = request.cookies.get('session-token')?.value;
    if (!sessionToken) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 });
    }

    // Trouver la session
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true }
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ success: false, message: 'Session expirée' }, { status: 401 });
    }

    // Supprimer le like
    await prisma.like.deleteMany({
      where: {
        userId: session.userId,
        contentId: parseInt(contentId),
        contentType: contentType.toUpperCase() as 'MOVIE' | 'SERIES'
      }
    });

    // Compter le nombre total de likes
    const likeCount = await prisma.like.count({
      where: {
        contentId: parseInt(contentId),
        contentType: contentType.toUpperCase() as 'MOVIE' | 'SERIES'
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Like supprimé',
      data: { likeCount }
    });

  } catch (error) {
    console.error('Erreur lors de la suppression du like:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Erreur serveur' 
    }, { status: 500 });
  }
}
