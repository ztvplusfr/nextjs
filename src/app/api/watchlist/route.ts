import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Récupérer la watchlist de l'utilisateur
export async function GET(request: NextRequest) {
  
  try {
    const sessionToken = request.cookies.get('session-token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier la session
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true }
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ success: false, message: 'Session expirée' }, { status: 401 });
    }

    // Récupérer la watchlist de l'utilisateur
    const watchlist = await prisma.watchlist.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ 
      success: true, 
      data: watchlist 
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la watchlist:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Erreur serveur' 
    }, { status: 500 });
  }
}

// POST - Ajouter un élément à la watchlist
export async function POST(request: NextRequest) {
  
  try {
    const sessionToken = request.cookies.get('session-token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier la session
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true }
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ success: false, message: 'Session expirée' }, { status: 401 });
    }

    const { contentId, contentType } = await request.json();

    if (!contentId || !contentType) {
      return NextResponse.json({ 
        success: false, 
        message: 'contentId et contentType requis' 
      }, { status: 400 });
    }

    if (!['MOVIE', 'SERIES'].includes(contentType)) {
      return NextResponse.json({ 
        success: false, 
        message: 'contentType doit être MOVIE ou SERIES' 
      }, { status: 400 });
    }

    // Vérifier si l'élément existe déjà dans la watchlist
    const existingItem = await prisma.watchlist.findUnique({
      where: {
        userId_contentId_contentType: {
          userId: session.userId,
          contentId: parseInt(contentId),
          contentType: contentType
        }
      }
    });

    if (existingItem) {
      return NextResponse.json({ 
        success: false, 
        message: 'Élément déjà dans la watchlist' 
      }, { status: 409 });
    }

    // Ajouter à la watchlist
    const watchlistItem = await prisma.watchlist.create({
      data: {
        userId: session.userId,
        contentId: parseInt(contentId),
        contentType: contentType
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: watchlistItem,
      message: 'Ajouté à la watchlist'
    });

  } catch (error) {
    console.error('Erreur lors de l\'ajout à la watchlist:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Erreur serveur' 
    }, { status: 500 });
  }
}

// DELETE - Supprimer un élément de la watchlist
export async function DELETE(request: NextRequest) {
  
  try {
    const sessionToken = request.cookies.get('session-token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier la session
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true }
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ success: false, message: 'Session expirée' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');
    const contentType = searchParams.get('contentType');

    if (!contentId || !contentType) {
      return NextResponse.json({ 
        success: false, 
        message: 'contentId et contentType requis' 
      }, { status: 400 });
    }

    // Valider et convertir le contentType
    const validContentType = contentType.toUpperCase();
    if (!['MOVIE', 'SERIES'].includes(validContentType)) {
      return NextResponse.json({ 
        success: false, 
        message: 'contentType invalide. Utilisez MOVIE ou SERIES' 
      }, { status: 400 });
    }

    // Supprimer de la watchlist
    const deletedItem = await prisma.watchlist.deleteMany({
      where: {
        userId: session.userId,
        contentId: parseInt(contentId),
        contentType: validContentType as 'MOVIE' | 'SERIES'
      }
    });

    if (deletedItem.count === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Élément non trouvé dans la watchlist' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Supprimé de la watchlist'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de la watchlist:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Erreur serveur' 
    }, { status: 500 });
  }
}
