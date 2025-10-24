import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Paramètres de pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const offset = (page - 1) * limit;
    
    // Paramètres de filtres
    const genre = searchParams.get('genre');
    const year = searchParams.get('year');
    const minRating = searchParams.get('minRating');
    const sortBy = searchParams.get('sortBy') || 'releaseDate'; // releaseDate, rating, title
    const sortOrder = searchParams.get('sortOrder') || 'desc'; // asc, desc
    const search = searchParams.get('search');

    // Construction de la requête
    let whereClause: any = {};
    let orderBy: any = {};

    // Debug: Log des paramètres reçus
    console.log('Paramètres reçus:', { genre, year, minRating, search, sortBy, sortOrder });

    // Filtre par genre
    if (genre) {
      try {
        console.log('Recherche du genre:', genre);
        
        // D'abord, listons tous les genres disponibles
        const allGenres = await prisma.genre.findMany({
          select: { id: true, name: true }
        });
        console.log('Tous les genres disponibles:', allGenres);
        
        // Essayons de trouver l'ID du genre (MySQL ne supporte pas mode: 'insensitive')
        const genreRecord = await prisma.genre.findFirst({
          where: {
            name: genre
          },
          select: { id: true, name: true }
        });

        console.log('Genre trouvé:', genreRecord);

        if (genreRecord) {
          // Vérifions d'abord s'il y a des relations MovieGenre pour ce genre
          const movieGenres = await prisma.movieGenre.findMany({
            where: {
              genreId: genreRecord.id
            },
            select: {
              movieId: true,
              genre: {
                select: { name: true }
              }
            }
          });
          
          console.log('Relations MovieGenre trouvées:', movieGenres);
          
          if (movieGenres.length > 0) {
            // Utiliser l'ID du genre pour filtrer
            whereClause.genres = {
              some: {
                genreId: genreRecord.id
              }
            };
            console.log('Filtre genre appliqué avec ID:', genreRecord.id);
          } else {
            console.log('Aucune relation MovieGenre trouvée pour ce genre');
            whereClause.id = { in: [] };
          }
        } else {
          console.log('Genre non trouvé:', genre);
          // Si le genre n'existe pas, on ne retourne aucun film
          whereClause.id = { in: [] };
        }
      } catch (error) {
        console.error('Erreur lors de l\'application du filtre genre:', error);
        // Si le filtre genre échoue, on ne retourne aucun film
        whereClause.id = { in: [] };
      }
    }

    // Filtre par année
    if (year) {
      const yearInt = parseInt(year);
      whereClause.releaseDate = {
        gte: new Date(yearInt, 0, 1),
        lt: new Date(yearInt + 1, 0, 1)
      };
    }

    // Filtre par note minimale
    if (minRating) {
      whereClause.rating = {
        gte: parseFloat(minRating)
      };
    }

    // Filtre par recherche
    if (search) {
      whereClause.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          originalTitle: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }

    // Tri
    switch (sortBy) {
      case 'title':
        orderBy = { title: sortOrder };
        break;
      case 'rating':
        orderBy = { rating: sortOrder };
        break;
      case 'releaseDate':
      default:
        orderBy = { releaseDate: sortOrder };
        break;
    }

    // Debug: Log de la clause WHERE finale
    console.log('Clause WHERE finale:', JSON.stringify(whereClause, null, 2));

    // Requête principale
    let movies, totalCount;
    
    // Si on a un filtre par genre, utilisons une approche différente
    if (genre && whereClause.genres) {
      try {
        console.log('Utilisation de l\'approche avec filtre genre...');
        
        // D'abord, trouvons tous les IDs de films qui ont ce genre
        const movieIds = await prisma.movieGenre.findMany({
          where: {
            genreId: whereClause.genres.some.genreId
          },
          select: {
            movieId: true
          }
        });
        
        const ids = movieIds.map(mg => mg.movieId);
        console.log('IDs de films trouvés pour le genre:', ids);
        
        // Maintenant, récupérons les films avec ces IDs
        const newWhereClause = { ...whereClause };
        delete newWhereClause.genres;
        newWhereClause.id = { in: ids };
        
        [movies, totalCount] = await Promise.all([
          prisma.movie.findMany({
            where: newWhereClause,
            orderBy,
            skip: offset,
            take: limit,
            include: {
              genres: {
                include: {
                  genre: true
                }
              },
              category: true,
              videos: {
                where: { isActive: true },
                take: 1
              }
            }
          }),
          prisma.movie.count({
            where: newWhereClause
          })
        ]);
      } catch (error) {
        console.error('Erreur avec l\'approche genre:', error);
        // Fallback vers l'approche normale
        [movies, totalCount] = await Promise.all([
          prisma.movie.findMany({
            where: whereClause,
            orderBy,
            skip: offset,
            take: limit,
            include: {
              genres: {
                include: {
                  genre: true
                }
              },
              category: true,
              videos: {
                where: { isActive: true },
                take: 1
              }
            }
          }),
          prisma.movie.count({
            where: whereClause
          })
        ]);
      }
    } else {
      // Approche normale sans filtre genre
      [movies, totalCount] = await Promise.all([
        prisma.movie.findMany({
          where: whereClause,
          orderBy,
          skip: offset,
          take: limit,
          include: {
            genres: {
              include: {
                genre: true
              }
            },
            category: true,
            videos: {
              where: { isActive: true },
              take: 1
            }
          }
        }),
        prisma.movie.count({
          where: whereClause
        })
      ]);
    }

    // Formater les données
    const formattedMovies = movies.map(movie => ({
      ...movie,
      genres: movie.genres ? movie.genres.map(mg => mg.genre.name) : []
    }));

    // Calculer les métadonnées de pagination
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        movies: formattedMovies,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage,
          hasPrevPage
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des films:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
