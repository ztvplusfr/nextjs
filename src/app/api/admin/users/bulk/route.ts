import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
import jwt from 'jsonwebtoken';


// Middleware pour vérifier les permissions admin
async function checkAdminAuth(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) {
    return { error: 'Non authentifié', status: 401 };
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
  } catch (error) {
    return { error: 'Token invalide', status: 401 };
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { role: true }
  });

  if (!user || user.role !== 'ADMIN') {
    return { error: 'Accès refusé. Droits administrateur requis.', status: 403 };
  }

  return { userId: decoded.userId };
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await checkAdminAuth(request);
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { action, userIds, data } = await request.json();

    if (!action || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'Action et liste d\'utilisateurs requis' },
        { status: 400 }
      );
    }

    // Empêcher les actions sur son propre compte
    const filteredUserIds = userIds.filter((id: number) => id !== authCheck.userId);
    
    if (filteredUserIds.length !== userIds.length) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas effectuer cette action sur votre propre compte' },
        { status: 400 }
      );
    }

    let result: any = {};

    switch (action) {
      case 'activate':
        result = await prisma.user.updateMany({
          where: { id: { in: filteredUserIds } },
          data: { isActive: true }
        });
        break;

      case 'deactivate':
        result = await prisma.user.updateMany({
          where: { id: { in: filteredUserIds } },
          data: { isActive: false }
        });
        break;

      case 'changeRole':
        if (!data?.role) {
          return NextResponse.json(
            { error: 'Nouveau rôle requis' },
            { status: 400 }
          );
        }
        result = await prisma.user.updateMany({
          where: { id: { in: filteredUserIds } },
          data: { role: data.role }
        });
        break;

      case 'delete':
        // Supprimer les sessions d'abord
        await prisma.session.deleteMany({
          where: { userId: { in: filteredUserIds } }
        });
        
        // Puis supprimer les utilisateurs
        result = await prisma.user.deleteMany({
          where: { id: { in: filteredUserIds } }
        });
        break;

      case 'deleteSessions':
        result = await prisma.session.deleteMany({
          where: { userId: { in: filteredUserIds } }
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Action non supportée' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      message: `Action "${action}" effectuée avec succès`,
      affectedCount: result.count,
      userIds: filteredUserIds
    }, { status: 200 });

  } catch (error) {
    console.error('Admin users bulk action error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'action en lot' },
      { status: 500 }
    );
  }
}
