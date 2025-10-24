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

// Fonction pour faire des requêtes à l'API TMDB
async function fetchTmdbData(url: string, apiKey: string) {
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    }
  });

  if (!response.ok) {
    throw new Error(`Erreur TMDB API: ${response.status}`);
  }

  return response.json();
}

// Fonction pour importer un film
async function importMovie(tmdbId: number, config: any) {
  try {
    // Vérifier si le film existe déjà
    const existingMovie = await prisma.movie.findUnique({
      where: { tmdbId }
    });

    if (existingMovie) {
      return { success: false, message: 'Film déjà importé', movie: existingMovie };
    }

    // Récupérer les données du film depuis TMDB (les genres sont déjà inclus)
    const movieData = await fetchTmdbData(
      `${config.baseUrl}/movie/${tmdbId}?api_key=${config.apiKey}&language=${config.language}`,
      config.apiKey
    );

    // Récupérer les vidéos (trailers) du film
    let trailerId = null;
    try {
      const videosData = await fetchTmdbData(
        `${config.baseUrl}/movie/${tmdbId}/videos?api_key=${config.apiKey}&language=${config.language}`,
        config.apiKey
      );

      if (videosData.results && videosData.results.length > 0) {
        // Chercher d'abord un trailer en français
        let trailer = videosData.results.find((video: any) => 
          video.type === 'Trailer' && 
          video.site === 'YouTube' && 
          video.iso_639_1 === 'fr'
        );

        // Si pas de trailer en français, prendre le premier trailer YouTube
        if (!trailer) {
          trailer = videosData.results.find((video: any) => 
            video.type === 'Trailer' && 
            video.site === 'YouTube'
          );
        }

        if (trailer && trailer.key) {
          trailerId = trailer.key;
          console.log(`Trailer trouvé pour ${movieData.title}: ${trailerId}`);
        }
      }
    } catch (videoError) {
      console.warn('Erreur lors de la récupération des vidéos:', videoError);
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
        poster: movieData.poster_path ? `${config.imageBaseUrl}/w780${movieData.poster_path}` : null,
        backdrop: movieData.backdrop_path ? `${config.imageBaseUrl}/original${movieData.backdrop_path}` : null,
        trailer: trailerId,
        adult: movieData.adult,
        originalLanguage: movieData.original_language,
        releaseDate: movieData.release_date ? new Date(movieData.release_date) : null,
        isActive: true,
        isFeatured: false
      }
    });

    // Ajouter les genres
    console.log('Genres reçus de TMDB:', movieData.genres);
    if (movieData.genres && movieData.genres.length > 0) {
      console.log(`Traitement de ${movieData.genres.length} genres pour le film ${movie.title}`);
      for (const genreData of movieData.genres) {
        // Créer ou récupérer le genre
        let genre = await prisma.genre.findUnique({
          where: { tmdbId: genreData.id }
        });

        if (!genre) {
          genre = await prisma.genre.create({
            data: {
              tmdbId: genreData.id,
              name: genreData.name,
              slug: genreData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              isActive: true
            }
          });
        }

        // Lier le film au genre
        console.log(`Liaison du genre "${genre.name}" (ID: ${genre.id}) au film "${movie.title}" (ID: ${movie.id})`);
        await prisma.movieGenre.upsert({
          where: {
            movieId_genreId: {
              movieId: movie.id,
              genreId: genre.id
            }
          },
          update: {},
          create: {
            movieId: movie.id,
            genreId: genre.id
          }
        });
        console.log(`Genre "${genre.name}" lié avec succès au film "${movie.title}"`);
      }
    }

    // Enregistrer la synchronisation
    await prisma.tmdbSync.create({
      data: {
        type: 'movie',
        tmdbId: movieData.id,
        lastSync: new Date(),
        status: 'success'
      }
    });

    return { success: true, message: 'Film importé avec succès', movie };

  } catch (error) {
    console.error('Error importing movie:', error);
    
    // Enregistrer l'erreur
    await prisma.tmdbSync.create({
      data: {
        type: 'movie',
        tmdbId,
        lastSync: new Date(),
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Erreur inconnue'
      }
    });

    return { success: false, message: 'Erreur lors de l\'importation', error: error instanceof Error ? error.message : 'Erreur inconnue' };
  }
}

// Fonction pour importer une série
async function importSeries(tmdbId: number, config: any) {
  try {
    // Vérifier si la série existe déjà
    const existingSeries = await prisma.series.findUnique({
      where: { tmdbId }
    });

    if (existingSeries) {
      return { success: false, message: 'Série déjà importée', series: existingSeries };
    }

    // Récupérer les données de la série depuis TMDB
    const seriesData = await fetchTmdbData(
      `${config.baseUrl}/tv/${tmdbId}?api_key=${config.apiKey}&language=${config.language}`,
      config.apiKey
    );

    // Récupérer les vidéos (trailers) de la série
    let trailerId = null;
    try {
      const videosData = await fetchTmdbData(
        `${config.baseUrl}/tv/${tmdbId}/videos?api_key=${config.apiKey}&language=${config.language}`,
        config.apiKey
      );

      if (videosData.results && videosData.results.length > 0) {
        // Chercher d'abord un trailer en français
        let trailer = videosData.results.find((video: any) => 
          video.type === 'Trailer' && 
          video.site === 'YouTube' && 
          video.iso_639_1 === 'fr'
        );

        // Si pas de trailer en français, prendre le premier trailer YouTube
        if (!trailer) {
          trailer = videosData.results.find((video: any) => 
            video.type === 'Trailer' && 
            video.site === 'YouTube'
          );
        }

        if (trailer && trailer.key) {
          trailerId = trailer.key;
          console.log(`Trailer trouvé pour ${seriesData.name}: ${trailerId}`);
        }
      }
    } catch (videoError) {
      console.warn('Erreur lors de la récupération des vidéos:', videoError);
    }

    // Créer la série
    const series = await prisma.series.create({
      data: {
        tmdbId: seriesData.id,
        title: seriesData.name,
        originalTitle: seriesData.original_name,
        description: seriesData.overview,
        year: seriesData.first_air_date ? new Date(seriesData.first_air_date).getFullYear() : null,
        rating: seriesData.vote_average,
        voteCount: seriesData.vote_count,
        popularity: seriesData.popularity,
        poster: seriesData.poster_path ? `${config.imageBaseUrl}/w780${seriesData.poster_path}` : null,
        backdrop: seriesData.backdrop_path ? `${config.imageBaseUrl}/original${seriesData.backdrop_path}` : null,
        trailer: trailerId,
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

    // Ajouter les genres
    if (seriesData.genres && seriesData.genres.length > 0) {
      for (const genreData of seriesData.genres) {
        // Créer ou récupérer le genre
        let genre = await prisma.genre.findUnique({
          where: { tmdbId: genreData.id }
        });

        if (!genre) {
          genre = await prisma.genre.create({
            data: {
              tmdbId: genreData.id,
              name: genreData.name,
              slug: genreData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              isActive: true
            }
          });
        }

        // Lier la série au genre
        await prisma.seriesGenre.upsert({
          where: {
            seriesId_genreId: {
              seriesId: series.id,
              genreId: genre.id
            }
          },
          update: {},
          create: {
            seriesId: series.id,
            genreId: genre.id
          }
        });
      }
    }

    // Importer les saisons et épisodes
    console.log(`Importation des saisons pour la série "${series.title}" (${seriesData.number_of_seasons} saisons)`);
    
    for (let seasonNumber = 1; seasonNumber <= seriesData.number_of_seasons; seasonNumber++) {
      try {
        // Récupérer les données de la saison depuis TMDB
        const seasonData = await fetchTmdbData(
          `${config.baseUrl}/tv/${tmdbId}/season/${seasonNumber}?api_key=${config.apiKey}&language=${config.language}`,
          config.apiKey
        );

        // Créer la saison
        const season = await prisma.season.create({
          data: {
            tmdbId: seasonData.id,
            number: seasonData.season_number,
            title: seasonData.name,
            description: seasonData.overview,
            poster: seasonData.poster_path ? `${config.imageBaseUrl}/w500${seasonData.poster_path}` : null,
            airDate: seasonData.air_date ? new Date(seasonData.air_date) : null,
            episodeCount: seasonData.episodes ? seasonData.episodes.length : 0,
            seriesId: series.id,
            isActive: true
          }
        });

        console.log(`Saison ${seasonNumber} créée: "${season.title}" (${season.episodeCount} épisodes)`);

        // Importer les épisodes de cette saison
        if (seasonData.episodes && seasonData.episodes.length > 0) {
          for (const episodeData of seasonData.episodes) {
            try {
              await prisma.episode.create({
                data: {
                  tmdbId: episodeData.id,
                  number: episodeData.episode_number,
                  title: episodeData.name,
                  description: episodeData.overview,
                  duration: episodeData.runtime,
                  airDate: episodeData.air_date ? new Date(episodeData.air_date) : null,
                  rating: episodeData.vote_average ? Math.round(episodeData.vote_average * 10) / 10 : null,
                  voteCount: episodeData.vote_count || 0,
                  stillPath: episodeData.still_path ? `${config.imageBaseUrl}/w500${episodeData.still_path}` : null,
                  seasonId: season.id,
                  isActive: true
                }
              });
            } catch (episodeError) {
              console.error(`Erreur lors de l'importation de l'épisode ${episodeData.episode_number} de la saison ${seasonNumber}:`, episodeError);
            }
          }
        }

      } catch (seasonError) {
        console.error(`Erreur lors de l'importation de la saison ${seasonNumber}:`, seasonError);
      }
    }

    // Enregistrer la synchronisation
    await prisma.tmdbSync.create({
      data: {
        type: 'tv',
        tmdbId: seriesData.id,
        lastSync: new Date(),
        status: 'success'
      }
    });

    return { success: true, message: 'Série importée avec succès', series };

  } catch (error) {
    console.error('Error importing series:', error);
    
    // Enregistrer l'erreur
    await prisma.tmdbSync.create({
      data: {
        type: 'tv',
        tmdbId,
        lastSync: new Date(),
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Erreur inconnue'
      }
    });

    return { success: false, message: 'Erreur lors de l\'importation', error: error instanceof Error ? error.message : 'Erreur inconnue' };
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await checkAdminAuth(request);
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { type, tmdbId } = await request.json();

    if (!type || !tmdbId) {
      return NextResponse.json(
        { error: 'Type et ID TMDB requis' },
        { status: 400 }
      );
    }

    if (!['movie', 'tv'].includes(type)) {
      return NextResponse.json(
        { error: 'Type doit être "movie" ou "tv"' },
        { status: 400 }
      );
    }

    // Récupérer la configuration TMDB
    const config = await getTmdbConfig();

    let result;
    if (type === 'movie') {
      result = await importMovie(parseInt(tmdbId), config);
    } else {
      result = await importSeries(parseInt(tmdbId), config);
    }

    return NextResponse.json(result, { status: result.success ? 200 : 400 });

  } catch (error) {
    console.error('TMDB import error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'importation TMDB' },
      { status: 500 }
    );
  }
}
