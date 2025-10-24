import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

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

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID du token requis' },
        { status: 400 }
      );
    }

    // Calculer la date d'expiration (5 minutes à partir de maintenant)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Activer le token et définir l'expiration
    const updatedToken = await prisma.passwordReset.update({
      where: { id: parseInt(id) },
      data: {
        active: true,
        expiresAt: expiresAt
      }
    });

    // Générer l'URL complète de réinitialisation
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${updatedToken.token}`;

    return NextResponse.json({
      success: true,
      message: 'Token activé avec succès',
      resetUrl: resetUrl,
      data: {
        id: updatedToken.id,
        email: updatedToken.email,
        token: updatedToken.token,
        expiresAt: updatedToken.expiresAt,
        active: updatedToken.active
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'activation du token:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
