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

export async function GET(request: NextRequest) {
  try {
    const authCheck = await checkAdminAuth(request);
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const skip = (page - 1) * limit;

    const where: any = {};
    if (userId) {
      where.userId = parseInt(userId);
    }

    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.session.count({ where })
    ]);

    return NextResponse.json({
      sessions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Admin user sessions GET error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des sessions' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authCheck = await checkAdminAuth(request);
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');

    if (!sessionId && !userId) {
      return NextResponse.json(
        { error: 'L\'ID de session ou d\'utilisateur est requis' },
        { status: 400 }
      );
    }

    let deletedCount = 0;

    if (sessionId) {
      // Supprimer une session spécifique
      const result = await prisma.session.deleteMany({
        where: { id: sessionId }
      });
      deletedCount = result.count;
    } else if (userId) {
      // Supprimer toutes les sessions d'un utilisateur
      const result = await prisma.session.deleteMany({
        where: { userId: parseInt(userId) }
      });
      deletedCount = result.count;
    }

    return NextResponse.json({
      message: `${deletedCount} session(s) supprimée(s) avec succès`,
      deletedCount
    }, { status: 200 });

  } catch (error) {
    console.error('Admin user sessions DELETE error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression des sessions' },
      { status: 500 }
    );
  }
}
