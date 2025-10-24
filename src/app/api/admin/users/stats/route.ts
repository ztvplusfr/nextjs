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
    const period = searchParams.get('period') || '30'; // jours
    const days = parseInt(period);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Statistiques générales
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      newUsers,
      usersByRole,
      recentRegistrations,
      activeSessions,
      sessionsByDevice,
      usersByCreationMonth
    ] = await Promise.all([
      // Total utilisateurs
      prisma.user.count(),
      
      // Utilisateurs actifs
      prisma.user.count({ where: { isActive: true } }),
      
      // Utilisateurs inactifs
      prisma.user.count({ where: { isActive: false } }),
      
      // Nouveaux utilisateurs (période)
      prisma.user.count({
        where: { createdAt: { gte: startDate } }
      }),
      
      // Utilisateurs par rôle
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true }
      }),
      
      // Inscriptions récentes
      prisma.user.findMany({
        where: { createdAt: { gte: startDate } },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          role: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      
      // Sessions actives
      prisma.session.count({
        where: { expiresAt: { gt: new Date() } }
      }),
      
      // Sessions par appareil
      prisma.session.groupBy({
        by: ['device'],
        _count: { device: true },
        where: { expiresAt: { gt: new Date() } }
      }),
      
      // Utilisateurs par mois de création
      prisma.$queryRaw`
        SELECT 
          DATE_FORMAT(createdAt, '%Y-%m') as month,
          COUNT(*) as count
        FROM users 
        WHERE createdAt >= ${startDate}
        GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
        ORDER BY month ASC
      `
    ]);

    // Statistiques des sessions
    const sessionStats = await prisma.session.aggregate({
      where: { expiresAt: { gt: new Date() } },
      _count: { id: true }
    });

    // Top utilisateurs par nombre de sessions
    const topUsersBySessions = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        _count: {
          select: { sessions: true }
        }
      },
      orderBy: {
        sessions: {
          _count: 'desc'
        }
      },
      take: 10
    });

    const stats = {
      overview: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        newUsers,
        activeSessions,
        period: days
      },
      usersByRole: usersByRole.map(item => ({
        role: item.role,
        count: item._count.role
      })),
      recentRegistrations,
      sessionsByDevice: sessionsByDevice.map(item => ({
        device: item.device || 'Inconnu',
        count: item._count.device
      })),
      usersByCreationMonth,
      topUsersBySessions,
      sessionStats: {
        averageSessionsPerUser: totalUsers > 0 ? (sessionStats._count.id / totalUsers) : 0,
        totalActiveSessions: sessionStats._count.id
      }
    };

    return NextResponse.json(stats, { status: 200 });

  } catch (error) {
    console.error('Admin users stats error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques utilisateurs' },
      { status: 500 }
    );
  }
}
