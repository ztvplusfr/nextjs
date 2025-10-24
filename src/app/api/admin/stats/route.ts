import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
import jwt from 'jsonwebtoken';


export async function GET(request: NextRequest) {
  try {
    // S'assurer que Prisma est connecté// Vérifier l'authentification
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
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

    // Vérifier que l'utilisateur est admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès refusé. Droits administrateur requis.' },
        { status: 403 }
      );
    }

    // Récupérer les statistiques
    const [
      totalUsers,
      activeUsers,
      totalMovies,
      totalSeries,
      totalSeasons,
      totalEpisodes,
      totalVideos,
      totalGenres,
      totalCategories
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.movie.count(),
      prisma.series.count(),
      prisma.season.count(),
      prisma.episode.count(),
      prisma.video.count(),
      prisma.genre.count(),
      prisma.category.count()
    ]);

    const stats = {
      totalUsers,
      activeUsers,
      totalMovies,
      totalSeries,
      totalSeasons,
      totalEpisodes,
      totalVideos,
      totalGenres,
      totalCategories
    };

    return NextResponse.json(stats, { status: 200 });

  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    );
  }
}
