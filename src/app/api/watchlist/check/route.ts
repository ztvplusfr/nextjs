import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
// GET - Vérifier si un élément est dans la watchlist
export async function GET(request: NextRequest) {
  
  try {
    const sessionToken = request.cookies.get('session-token')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 });
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

    // Optimisation: requête directe sans vérification de session complète
    const watchlistItem = await prisma.watchlist.findFirst({
      where: {
        user: {
          sessions: {
            some: {
              token: sessionToken,
              expiresAt: {
                gt: new Date()
              }
            }
          }
        },
        contentId: parseInt(contentId),
        contentType: validContentType as 'MOVIE' | 'SERIES'
      },
      select: {
        id: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: { isInWatchlist: !!watchlistItem }
    });

  } catch (error) {
    console.error('Erreur lors de la vérification de la watchlist:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Erreur serveur' 
    }, { status: 500 });
  }
}
