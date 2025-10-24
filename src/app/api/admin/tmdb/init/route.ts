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

    // Vérifier si les variables d'environnement sont définies
    const apiKey = process.env.TMDB_API_KEY;
    const baseUrl = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
    const imageBaseUrl = process.env.TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p';
    const language = process.env.TMDB_LANGUAGE || 'fr-FR';

    if (!apiKey) {
      return NextResponse.json(
        { error: 'TMDB_API_KEY n\'est pas définie dans les variables d\'environnement' },
        { status: 400 }
      );
    }

    // Désactiver les autres configurations
    await prisma.tmdbConfig.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });

    // Créer la configuration depuis les variables d'environnement
    const config = await prisma.tmdbConfig.upsert({
      where: { apiKey },
      update: {
        baseUrl,
        imageBaseUrl,
        language,
        isActive: true
      },
      create: {
        apiKey,
        baseUrl,
        imageBaseUrl,
        language,
        isActive: true
      }
    });

    return NextResponse.json({ 
      config,
      message: 'Configuration TMDB initialisée avec succès depuis les variables d\'environnement'
    }, { status: 201 });

  } catch (error) {
    console.error('Admin TMDB init error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'initialisation de la configuration TMDB' },
      { status: 500 }
    );
  }
}
