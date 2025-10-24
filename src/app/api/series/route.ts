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
    
    // Paramètres de filtrage
    const genre = searchParams.get('genre');
    const year = searchParams.get('year');
    const minRating = searchParams.get('minRating');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'releaseDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Construction de la requête
    const where: any = {};
    
    // Filtre par genre
    if (genre) {
      where.genres = {
        some: {
          name: genre
        }
      };
    }
    
    // Filtre par année
    if (year) {
      const yearInt = parseInt(year);
      where.firstAirDate = {
        gte: new Date(`${yearInt}-01-01`),
        lt: new Date(`${yearInt + 1}-01-01`)
      };
    }
    
    // Filtre par note minimale
    if (minRating) {
      const ratingFloat = parseFloat(minRating);
      where.rating = {
        gte: ratingFloat
      };
    }
    
    // Recherche par titre
    if (search) {
      where.OR = [
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
    
    // Construction du tri
    const orderBy: any = {};
    if (sortBy === 'title') {
      orderBy.title = sortOrder;
    } else if (sortBy === 'rating') {
      orderBy.rating = sortOrder;
    } else {
      orderBy.firstAirDate = sortOrder;
    }
    
    // Récupération des séries avec pagination
    const [series, totalCount] = await Promise.all([
      prisma.series.findMany({
        where,
        include: {
          genres: {
            include: {
              genre: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy,
        skip: offset,
        take: limit
      }),
      prisma.series.count({ where })
    ]);
    
    // Formatage des données
    const formattedSeries = series.map(series => ({
      id: series.id,
      title: series.title,
      originalTitle: series.originalTitle,
      description: series.description,
      year: series.firstAirDate ? new Date(series.firstAirDate).getFullYear() : series.year,
      rating: series.rating,
      poster: series.poster,
      backdrop: series.backdrop,
      releaseDate: series.firstAirDate,
      genres: series.genres.map(g => g.genre.name),
      numberOfSeasons: series.numberOfSeasons,
      numberOfEpisodes: series.numberOfEpisodes
    }));
    
    // Calcul de la pagination
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    const pagination = {
      currentPage: page,
      totalPages,
      totalCount,
      limit,
      hasNextPage,
      hasPrevPage
    };
    
    return NextResponse.json({
      success: true,
      data: {
        series: formattedSeries,
        pagination
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des séries:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
