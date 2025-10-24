import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredPasswordResetTokens, cleanupUsedPasswordResetTokens, cleanupAllPasswordResetTokens } from '@/lib/password-reset';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification admin - Temporairement désactivée pour les tests
    // TODO: Implémenter l'authentification JWT
    /*
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Token d\'authentification requis' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé' },
        { status: 403 }
      );
    }
    */

    const { type = 'expired' } = await request.json();

    let deletedCount = 0;

    switch (type) {
      case 'expired':
        deletedCount = await cleanupExpiredPasswordResetTokens();
        break;
      case 'used':
        deletedCount = await cleanupUsedPasswordResetTokens();
        break;
      case 'all':
        deletedCount = await cleanupAllPasswordResetTokens();
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Type de nettoyage invalide (expired, used, all)' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `${deletedCount} tokens nettoyés`,
      data: { deletedCount, type }
    });

  } catch (error) {
    console.error('Erreur lors du nettoyage:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
