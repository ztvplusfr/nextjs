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

// Fonction pour synchroniser les films existants
async function syncExistingMovies(config: any) {
  try {
    // Récupérer tous les films existants avec tmdbId
    const existingMovies = await prisma.movie.findMany({
      where: {
        tmdbId: { not: null }
      },
      select: {
        id: true,
        tmdbId: true,
        title: true
      }
    });

    const results = [];

    for (const movie of existingMovies) {
      try {
        if (!movie.tmdbId) {
          results.push({ success: false, message: `Film "${movie.title}" sans ID TMDB`, tmdbId: null });
          continue;
        }

        // Récupérer les détails complets du film depuis TMDB
        const movieDetails = await fetchTmdbData(
          `${config.baseUrl}/movie/${movie.tmdbId}?api_key=${config.apiKey}&language=${config.language}&append_to_response=genres`,
          config.apiKey
        );

        // Récupérer les vidéos (trailers) du film
        let trailerId = null;
        try {
          const videosData = await fetchTmdbData(
            `${config.baseUrl}/movie/${movie.tmdbId}/videos?api_key=${config.apiKey}&language=${config.language}`,
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
              console.log(`Trailer trouvé pour ${movieDetails.title}: ${trailerId}`);
            }
          }
        } catch (videoError) {
          console.warn('Erreur lors de la récupération des vidéos:', videoError);
        }

        // Mettre à jour le film existant
        await prisma.movie.update({
          where: { id: movie.id },
          data: {
            title: movieDetails.title,
            originalTitle: movieDetails.original_title,
            description: movieDetails.overview,
            year: movieDetails.release_date ? new Date(movieDetails.release_date).getFullYear() : null,
            duration: movieDetails.runtime,
            rating: movieDetails.vote_average ? Math.round(movieDetails.vote_average * 10) / 10 : null,
            voteCount: movieDetails.vote_count,
            popularity: movieDetails.popularity,
            poster: movieDetails.poster_path ? `${config.imageBaseUrl}/w780${movieDetails.poster_path}` : null,
            backdrop: movieDetails.backdrop_path ? `${config.imageBaseUrl}/original${movieDetails.backdrop_path}` : null,
            trailer: trailerId,
            adult: movieDetails.adult,
            originalLanguage: movieDetails.original_language,
            releaseDate: movieDetails.release_date ? new Date(movieDetails.release_date) : null,
            updatedAt: new Date()
          }
        });

        // Mettre à jour les genres
        if (movieDetails.genres && movieDetails.genres.length > 0) {
          // Supprimer les anciens genres
          await prisma.movieGenre.deleteMany({
            where: { movieId: movie.id }
          });

          // Ajouter les nouveaux genres
          for (const genreData of movieDetails.genres) {
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
            await prisma.movieGenre.create({
              data: {
                movieId: movie.id,
                genreId: genre.id
              }
            });
          }
        }

        // Enregistrer la synchronisation
        await prisma.tmdbSync.create({
          data: {
            type: 'movie',
            tmdbId: movie.tmdbId,
            lastSync: new Date(),
            status: 'success'
          }
        });

        results.push({ success: true, message: `Film "${movieDetails.title}" synchronisé avec succès`, tmdbId: movie.tmdbId });

      } catch (error) {
        console.error(`Erreur lors de la synchronisation du film ${movie.tmdbId}:`, error);
        
        if (movie.tmdbId) {
          await prisma.tmdbSync.create({
            data: {
              type: 'movie',
              tmdbId: movie.tmdbId,
              lastSync: new Date(),
              status: 'error',
              errorMessage: error instanceof Error ? error.message : 'Erreur inconnue'
            }
          });
        }

        results.push({ 
          success: false, 
          message: `Erreur lors de la synchronisation du film "${movie.title}"`, 
          tmdbId: movie.tmdbId,
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        });
      }
    }

    return results;

  } catch (error) {
    console.error('Erreur lors de la synchronisation des films:', error);
    throw error;
  }
}

// Fonction pour synchroniser les séries existantes
async function syncExistingSeries(config: any) {
  try {
    // Récupérer toutes les séries existantes avec tmdbId
    const existingSeries = await prisma.series.findMany({
      where: {
        tmdbId: { not: null }
      },
      select: {
        id: true,
        tmdbId: true,
        title: true
      }
    });

    const results = [];

    for (const series of existingSeries) {
      try {
        if (!series.tmdbId) {
          results.push({ success: false, message: `Série "${series.title}" sans ID TMDB`, tmdbId: null });
          continue;
        }

        // Récupérer les détails complets de la série depuis TMDB
        const seriesDetails = await fetchTmdbData(
          `${config.baseUrl}/tv/${series.tmdbId}?api_key=${config.apiKey}&language=${config.language}&append_to_response=genres`,
          config.apiKey
        );

        // Récupérer les vidéos (trailers) de la série
        let trailerId = null;
        try {
          const videosData = await fetchTmdbData(
            `${config.baseUrl}/tv/${series.tmdbId}/videos?api_key=${config.apiKey}&language=${config.language}`,
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
              console.log(`Trailer trouvé pour ${seriesDetails.name}: ${trailerId}`);
            }
          }
        } catch (videoError) {
          console.warn('Erreur lors de la récupération des vidéos:', videoError);
        }

        // Mettre à jour la série existante
        await prisma.series.update({
          where: { id: series.id },
          data: {
            title: seriesDetails.name,
            originalTitle: seriesDetails.original_name,
            description: seriesDetails.overview,
            year: seriesDetails.first_air_date ? new Date(seriesDetails.first_air_date).getFullYear() : null,
            rating: seriesDetails.vote_average ? Math.round(seriesDetails.vote_average * 10) / 10 : null,
            voteCount: seriesDetails.vote_count,
            popularity: seriesDetails.popularity,
            poster: seriesDetails.poster_path ? `${config.imageBaseUrl}/w780${seriesDetails.poster_path}` : null,
            backdrop: seriesDetails.backdrop_path ? `${config.imageBaseUrl}/original${seriesDetails.backdrop_path}` : null,
            trailer: trailerId,
            adult: seriesDetails.adult,
            originalLanguage: seriesDetails.original_language,
            firstAirDate: seriesDetails.first_air_date ? new Date(seriesDetails.first_air_date) : null,
            lastAirDate: seriesDetails.last_air_date ? new Date(seriesDetails.last_air_date) : null,
            numberOfSeasons: seriesDetails.number_of_seasons,
            numberOfEpisodes: seriesDetails.number_of_episodes,
            status: seriesDetails.status,
            updatedAt: new Date()
          }
        });

        // Mettre à jour les genres
        if (seriesDetails.genres && seriesDetails.genres.length > 0) {
          // Supprimer les anciens genres
          await prisma.seriesGenre.deleteMany({
            where: { seriesId: series.id }
          });

          // Ajouter les nouveaux genres
          for (const genreData of seriesDetails.genres) {
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
            await prisma.seriesGenre.create({
              data: {
                seriesId: series.id,
                genreId: genre.id
              }
            });
          }
        }

        // Synchroniser les saisons et épisodes
        console.log(`Synchronisation des saisons pour la série "${seriesDetails.name}" (${seriesDetails.number_of_seasons} saisons)`);
        
        // Supprimer les anciennes saisons et épisodes
        await prisma.episode.deleteMany({
          where: {
            season: {
              seriesId: series.id
            }
          }
        });
        await prisma.season.deleteMany({
          where: { seriesId: series.id }
        });

        // Réimporter toutes les saisons et épisodes
        for (let seasonNumber = 1; seasonNumber <= seriesDetails.number_of_seasons; seasonNumber++) {
          try {
            // Récupérer les données de la saison depuis TMDB
            const seasonData = await fetchTmdbData(
              `${config.baseUrl}/tv/${series.tmdbId}/season/${seasonNumber}?api_key=${config.apiKey}&language=${config.language}`,
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

            console.log(`Saison ${seasonNumber} synchronisée: "${season.title}" (${season.episodeCount} épisodes)`);

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
                  console.error(`Erreur lors de la synchronisation de l'épisode ${episodeData.episode_number} de la saison ${seasonNumber}:`, episodeError);
                }
              }
            }

          } catch (seasonError) {
            console.error(`Erreur lors de la synchronisation de la saison ${seasonNumber}:`, seasonError);
          }
        }

        // Enregistrer la synchronisation
        await prisma.tmdbSync.create({
          data: {
            type: 'tv',
            tmdbId: series.tmdbId,
            lastSync: new Date(),
            status: 'success'
          }
        });

        results.push({ success: true, message: `Série "${seriesDetails.name}" synchronisée avec succès`, tmdbId: series.tmdbId });

      } catch (error) {
        console.error(`Erreur lors de la synchronisation de la série ${series.tmdbId}:`, error);
        
        if (series.tmdbId) {
          await prisma.tmdbSync.create({
            data: {
              type: 'tv',
              tmdbId: series.tmdbId,
              lastSync: new Date(),
              status: 'error',
              errorMessage: error instanceof Error ? error.message : 'Erreur inconnue'
            }
          });
        }

        results.push({ 
          success: false, 
          message: `Erreur lors de la synchronisation de la série "${series.title}"`, 
          tmdbId: series.tmdbId,
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        });
      }
    }

    return results;

  } catch (error) {
    console.error('Erreur lors de la synchronisation des séries:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await checkAdminAuth(request);
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { type, limit } = await request.json();

    if (!type) {
      return NextResponse.json(
        { error: 'Type requis (movies ou series)' },
        { status: 400 }
      );
    }

    if (!['movies', 'series'].includes(type)) {
      return NextResponse.json(
        { error: 'Type doit être "movies" ou "series"' },
        { status: 400 }
      );
    }

    // Récupérer la configuration TMDB
    const config = await getTmdbConfig();

    let results;
    if (type === 'movies') {
      results = await syncExistingMovies(config);
    } else {
      results = await syncExistingSeries(config);
    }

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Synchronisation terminée: ${successCount} succès, ${errorCount} erreurs`,
      results,
      summary: {
        total: results.length,
        success: successCount,
        errors: errorCount
      }
    });

  } catch (error) {
    console.error('TMDB sync error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la synchronisation TMDB' },
      { status: 500 }
    );
  }
}
