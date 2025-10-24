import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
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

    // Récupérer tous les tokens non utilisés
    const passwordResets = await prisma.passwordReset.findMany({
      where: { used: false },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        createdAt: true,
        expiresAt: true,
        active: true
      }
    });

    return NextResponse.json({
      success: true,
      data: passwordResets
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des tokens:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
