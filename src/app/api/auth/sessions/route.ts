import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
import jwt from 'jsonwebtoken';


export async function GET(request: NextRequest) {
  try {
    // S'assurer que Prisma est connecté// Récupérer le token depuis les cookies
    const token = request.cookies.get('auth-token')?.value;
    const sessionToken = request.cookies.get('session-token')?.value;

    if (!token || !sessionToken) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Vérifier le JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    } catch (error) {
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 401 }
      );
    }

    // Vérifier que la session actuelle est valide
    const currentSession = await prisma.session.findFirst({
      where: {
        token: sessionToken,
        userId: decoded.userId, 
        expiresAt: {
          gt: new Date() // Session non expirée
        }
      }
    });

    if (!currentSession) {
      return NextResponse.json(
        { error: 'Session expirée ou invalide' },
        { status: 401 }
      );
    }

    // Récupérer toutes les sessions de l'utilisateur
    const sessions = await prisma.session.findMany({
      where: {
        userId: decoded.userId
      },
      select: {
        id: true,
        token: true,
        ipAddress: true,
        device: true,
        browser: true,
        os: true,
        createdAt: true,
        updatedAt: true,
        expiresAt: true
      },
      orderBy: {
        updatedAt: 'desc' // Sessions les plus récentes en premier
      }
    });

    // Marquer la session actuelle
    const sessionsWithCurrent = sessions.map(session => ({
      ...session,
      isCurrent: session.token === sessionToken
    }));

    return NextResponse.json(
      {
        sessions: sessionsWithCurrent,
        total: sessions.length,
        active: sessions.filter(s => s.expiresAt > new Date()).length
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Sessions fetch error:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // S'assurer que Prisma est connecté// Récupérer le token depuis les cookies
    const token = request.cookies.get('auth-token')?.value;
    const sessionToken = request.cookies.get('session-token')?.value;

    if (!token || !sessionToken) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Vérifier le JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    } catch (error) {
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 401 }
      );
    }

    // Vérifier que la session actuelle est valide
    const currentSession = await prisma.session.findFirst({
      where: {
        token: sessionToken,
        userId: decoded.userId,
        expiresAt: {
          gt: new Date() // Session non expirée
        }
      }
    });

    if (!currentSession) {
      return NextResponse.json(
        { error: 'Session expirée ou invalide' },
        { status: 401 }
      );
    }

    // Supprimer toutes les autres sessions (garder seulement la session actuelle)
    const deletedSessions = await prisma.session.deleteMany({
      where: {
        userId: decoded.userId,
        token: {
          not: sessionToken // Garder la session actuelle
        }
      }
    });

    return NextResponse.json(
      { 
        message: 'Toutes les autres sessions ont été supprimées',
        deletedCount: deletedSessions.count
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Sessions deletion error:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
