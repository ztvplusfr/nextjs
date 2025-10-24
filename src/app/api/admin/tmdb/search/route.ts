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

// Fonction pour récupérer la configuration TMDB
async function getTmdbConfig() {
  const config = await prisma.tmdbConfig.findFirst({
    where: { isActive: true }
  });

  if (!config) {
    throw new Error('Configuration TMDB non trouvée');
  }

  return config;
}

export async function GET(request: NextRequest) {
  try {
    const authCheck = await checkAdminAuth(request);
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const type = searchParams.get('type') || 'movie';
    const page = searchParams.get('page') || '1';

    if (!query) {
      return NextResponse.json(
        { error: 'Paramètre de recherche requis' },
        { status: 400 }
      );
    }

    // Récupérer la configuration TMDB
    const config = await getTmdbConfig();

    // Construire l'URL de recherche
    const searchUrl = `${config.baseUrl}/search/${type}?api_key=${config.apiKey}&language=${config.language}&query=${encodeURIComponent(query)}&page=${page}`;

    // Faire la requête à TMDB
    const response = await fetch(searchUrl, {
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur TMDB API: ${response.status}`);
    }

    const data = await response.json();

    // Vérifier quels contenus sont déjà importés
    const tmdbIds = data.results.map((item: any) => item.id);
    
    let existingItems = [];
    if (type === 'movie') {
      existingItems = await prisma.movie.findMany({
        where: { tmdbId: { in: tmdbIds } },
        select: { tmdbId: true, title: true }
      });
    } else {
      existingItems = await prisma.series.findMany({
        where: { tmdbId: { in: tmdbIds } },
        select: { tmdbId: true, title: true }
      });
    }

    const existingTmdbIds = existingItems.map(item => item.tmdbId);

    // Ajouter l'information d'importation aux résultats
    const results = data.results.map((item: any) => ({
      ...item,
      isImported: existingTmdbIds.includes(item.id),
      posterUrl: item.poster_path ? `${config.imageBaseUrl}/w500${item.poster_path}` : null,
      backdropUrl: item.backdrop_path ? `${config.imageBaseUrl}/w1280${item.backdrop_path}` : null,
      releaseDate: type === 'movie' ? item.release_date : item.first_air_date,
      title: type === 'movie' ? item.title : item.name,
      originalTitle: type === 'movie' ? item.original_title : item.original_name
    }));

    return NextResponse.json({
      results,
      pagination: {
        page: data.page,
        totalPages: data.total_pages,
        totalResults: data.total_results
      },
      config: {
        imageBaseUrl: config.imageBaseUrl
      }
    }, { status: 200 });

  } catch (error) {
    console.error('TMDB search error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recherche TMDB' },
      { status: 500 }
    );
  }
}
