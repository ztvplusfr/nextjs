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

// Fonction pour importer les films populaires
async function importPopularMovies(config: any, limit: number = 20) {
  try {
    const response = await fetch(
      `${config.baseUrl}/movie/popular?api_key=${config.apiKey}&language=${config.language}&page=1`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (!response.ok) {
      throw new Error(`Erreur TMDB API: ${response.status}`);
    }

    const data = await response.json();
    const movies = data.results.slice(0, limit);
    const results = [];

    for (const movieData of movies) {
      try {
        // Vérifier si le film existe déjà
        const existingMovie = await prisma.movie.findUnique({
          where: { tmdbId: movieData.id }
        });

        if (existingMovie) {
          results.push({ success: false, message: 'Film déjà importé', tmdbId: movieData.id, title: movieData.title });
          continue;
        }

        // Créer le film
        const movie = await prisma.movie.create({
          data: {
            tmdbId: movieData.id,
            title: movieData.title,
            originalTitle: movieData.original_title,
            description: movieData.overview,
            year: movieData.release_date ? new Date(movieData.release_date).getFullYear() : null,
            duration: movieData.runtime,
            rating: movieData.vote_average ? Math.round(movieData.vote_average * 10) / 10 : null,
            voteCount: movieData.vote_count,
            popularity: movieData.popularity,
            poster: movieData.poster_path ? `${config.imageBaseUrl}/w500${movieData.poster_path}` : null,
            backdrop: movieData.backdrop_path ? `${config.imageBaseUrl}/w1280${movieData.backdrop_path}` : null,
            adult: movieData.adult,
            originalLanguage: movieData.original_language,
            releaseDate: movieData.release_date ? new Date(movieData.release_date) : null,
            isActive: true,
            isFeatured: false
          }
        });

        results.push({ success: true, message: 'Film importé', tmdbId: movieData.id, title: movieData.title, movie });

      } catch (error) {
        results.push({ 
          success: false, 
          message: 'Erreur lors de l\'importation', 
          tmdbId: movieData.id, 
          title: movieData.title,
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        });
      }
    }

    return results;

  } catch (error) {
    throw new Error(`Erreur lors de l'importation des films populaires: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

// Fonction pour importer les séries populaires
async function importPopularSeries(config: any, limit: number = 20) {
  try {
    const response = await fetch(
      `${config.baseUrl}/tv/popular?api_key=${config.apiKey}&language=${config.language}&page=1`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (!response.ok) {
      throw new Error(`Erreur TMDB API: ${response.status}`);
    }

    const data = await response.json();
    const series = data.results.slice(0, limit);
    const results = [];

    for (const seriesData of series) {
      try {
        // Vérifier si la série existe déjà
        const existingSeries = await prisma.series.findUnique({
          where: { tmdbId: seriesData.id }
        });

        if (existingSeries) {
          results.push({ success: false, message: 'Série déjà importée', tmdbId: seriesData.id, title: seriesData.name });
          continue;
        }

        // Créer la série
        const series = await prisma.series.create({
          data: {
            tmdbId: seriesData.id,
            title: seriesData.name,
            originalTitle: seriesData.original_name,
            description: seriesData.overview,
            year: seriesData.first_air_date ? new Date(seriesData.first_air_date).getFullYear() : null,
            rating: seriesData.vote_average ? Math.round(seriesData.vote_average * 10) / 10 : null,
            voteCount: seriesData.vote_count,
            popularity: seriesData.popularity,
            poster: seriesData.poster_path ? `${config.imageBaseUrl}/w500${seriesData.poster_path}` : null,
            backdrop: seriesData.backdrop_path ? `${config.imageBaseUrl}/w1280${seriesData.backdrop_path}` : null,
            adult: seriesData.adult,
            originalLanguage: seriesData.original_language,
            firstAirDate: seriesData.first_air_date ? new Date(seriesData.first_air_date) : null,
            lastAirDate: seriesData.last_air_date ? new Date(seriesData.last_air_date) : null,
            numberOfSeasons: seriesData.number_of_seasons,
            numberOfEpisodes: seriesData.number_of_episodes,
            status: seriesData.status,
            isActive: true,
            isFeatured: false
          }
        });

        results.push({ success: true, message: 'Série importée', tmdbId: seriesData.id, title: seriesData.name, series });

      } catch (error) {
        results.push({ 
          success: false, 
          message: 'Erreur lors de l\'importation', 
          tmdbId: seriesData.id, 
          title: seriesData.name,
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        });
      }
    }

    return results;

  } catch (error) {
    throw new Error(`Erreur lors de l'importation des séries populaires: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await checkAdminAuth(request);
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { type, limit = 20 } = await request.json();

    if (!type || !['movies', 'series'].includes(type)) {
      return NextResponse.json(
        { error: 'Type doit être "movies" ou "series"' },
        { status: 400 }
      );
    }

    // Récupérer la configuration TMDB
    const config = await getTmdbConfig();

    let results;
    if (type === 'movies') {
      results = await importPopularMovies(config, limit);
    } else {
      results = await importPopularSeries(config, limit);
    }

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      message: `Import en lot terminé: ${successCount} succès, ${errorCount} erreurs`,
      results,
      summary: {
        total: results.length,
        success: successCount,
        errors: errorCount
      }
    }, { status: 200 });

  } catch (error) {
    console.error('TMDB bulk import error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'import en lot TMDB' },
      { status: 500 }
    );
  }
}
