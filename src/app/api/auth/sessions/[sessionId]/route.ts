import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
import jwt from 'jsonwebtoken';


export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
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

    const resolvedParams = await params;
    console.log('Session ID reçu:', resolvedParams.sessionId);
    const sessionId = resolvedParams.sessionId;
    console.log('Session ID:', sessionId);

    if (!sessionId || typeof sessionId !== 'string') {
      console.log('Session ID invalide:', resolvedParams.sessionId);
      return NextResponse.json(
        { error: 'ID de session invalide' },
        { status: 400 }
      );
    }

    // Vérifier que la session appartient à l'utilisateur
    const sessionToDelete = await prisma.session.findFirst({
      where: {
        id: sessionId,
        userId: decoded.userId
      }
    });

    if (!sessionToDelete) {
      return NextResponse.json(
        { error: 'Session non trouvée ou non autorisée' },
        { status: 404 }
      );
    }

    // Empêcher la suppression de la session actuelle
    if (sessionToDelete.token === sessionToken) {
      return NextResponse.json(
        { error: 'Impossible de supprimer la session actuelle' },
        { status: 400 }
      );
    }

    // Supprimer la session
    await prisma.session.delete({
      where: {
        id: sessionId
      }
    });

    return NextResponse.json(
      { message: 'Session supprimée avec succès' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Session deletion error:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
