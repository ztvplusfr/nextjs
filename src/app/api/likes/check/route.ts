import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Vérifier le statut du like et compter les likes
export async function GET(request: NextRequest) {
  
  try {
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');
    const contentType = searchParams.get('contentType');
    
    if (!contentId || !contentType) {
      return NextResponse.json({ success: false, message: 'Paramètres manquants' }, { status: 400 });
    }

    // Vérifier l'authentification
    const sessionToken = request.cookies.get('session-token')?.value;
    let isLiked = false;
    let userId = null;

    if (sessionToken) {
      const session = await prisma.session.findUnique({
        where: { token: sessionToken },
        include: { user: true }
      });

      if (session && session.expiresAt > new Date()) {
        userId = session.userId;
        
        // Vérifier si l'utilisateur a liké ce contenu
        const like = await prisma.like.findUnique({
          where: {
            userId_contentId_contentType: {
              userId: session.userId,
              contentId: parseInt(contentId),
              contentType: contentType.toUpperCase() as any
            }
          }
        });
        
        isLiked = !!like;
      }
    }

    // Compter le nombre total de likes
    const likeCount = await prisma.like.count({
      where: {
        contentId: parseInt(contentId),
        contentType: contentType.toUpperCase() as any
      }
    });

    return NextResponse.json({ 
      success: true,
      data: { 
        isLiked,
        likeCount,
        userId
      }
    });

  } catch (error) {
    console.error('Erreur lors de la vérification du like:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Erreur serveur' 
    }, { status: 500 });
  }
}
