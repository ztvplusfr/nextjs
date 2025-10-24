import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {

    // Récupérer le token depuis les cookies
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

    // Vérifier la session en base de données avec gestion d'erreur
    let session;
    try {
      session = await prisma.session.findFirst({
        where: {
          token: sessionToken,
          userId: decoded.userId,
          expiresAt: { gt: new Date() }
        },
        select: {
          id: true,
          expiresAt: true,
          ipAddress: true,
          device: true,
          browser: true,
          os: true,
          user: {
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
          }
        }
      });
    } catch (dbError) {
      console.error('Database query error:', dbError);
      return NextResponse.json(
        { error: 'Erreur de base de données' },
        { status: 500 }
      );
    }

    if (!session) {
      return NextResponse.json(
        { error: 'Session expirée ou invalide' },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur est toujours actif
    if (!session.user.isActive) {
      return NextResponse.json(
        { error: 'Compte désactivé' },
        { status: 403 }
      );
    }

    // Mettre à jour la dernière activité de la session
    try {
      // Vérifier d'abord si la session existe encore
      const existingSession = await prisma.session.findUnique({
        where: { id: session.id },
        select: { id: true }
      });
      
      if (existingSession) {
        await prisma.session.update({
          where: { id: session.id },
          data: { updatedAt: new Date() }
        });
      }
    } catch (updateError) {
      console.error('Session update error:', updateError);
      // Ne pas faire échouer la requête si la mise à jour échoue
    }

    return NextResponse.json(
      {
        user: session.user,
        session: {
          id: session.id,
          expiresAt: session.expiresAt,
          ipAddress: session.ipAddress,
          device: session.device,
          browser: session.browser,
          os: session.os,
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
