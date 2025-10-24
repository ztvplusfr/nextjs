import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const sessionToken = request.cookies.get('session-token')?.value;
    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Trouver la session
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true }
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Session expirée' },
        { status: 401 }
      );
    }

    const { timezone } = await request.json();

    // Validation du timezone
    const validTimezones = [
      'Europe/Paris',
      'Europe/Brussels',
      'Indian/Mayotte',
      'Indian/Mauritius',
      'Indian/Reunion'
    ];

    if (!validTimezones.includes(timezone)) {
      return NextResponse.json(
        { success: false, error: 'Fuseau horaire invalide' },
        { status: 400 }
      );
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: { timezone },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        avatar: true,
        timezone: true,
        role: true,
        isActive: true,
        createdAt: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Profil mis à jour',
      user: updatedUser
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
