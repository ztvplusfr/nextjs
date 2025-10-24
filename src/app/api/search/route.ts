import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        results: []
      });
    }

    // Rechercher dans les films
    const movies = await prisma.movie.findMany({
      where: {
        AND: [
          { isActive: true },
          {
            OR: [
              { title: { contains: query } },
              { originalTitle: { contains: query } },
              { description: { contains: query } }
            ]
          }
        ]
      },
      select: {
        id: true,
        title: true,
        originalTitle: true,
        year: true,
        rating: true,
        poster: true,
        description: true
      },
      take: 10
    });

    // Rechercher dans les séries
    const series = await prisma.series.findMany({
      where: {
        AND: [
          { isActive: true },
          {
            OR: [
              { title: { contains: query } },
              { originalTitle: { contains: query } },
              { description: { contains: query } }
            ]
          }
        ]
      },
      select: {
        id: true,
        title: true,
        originalTitle: true,
        year: true,
        rating: true,
        poster: true,
        description: true
      },
      take: 10
    });

    // Formater les résultats
    const results = [
      ...movies.map(movie => ({
        id: movie.id,
        title: movie.title,
        originalTitle: movie.originalTitle,
        year: movie.year,
        rating: movie.rating,
        poster: movie.poster,
        type: 'movie'
      })),
      ...series.map(serie => ({
        id: serie.id,
        title: serie.title,
        originalTitle: serie.originalTitle,
        year: serie.year,
        rating: serie.rating,
        poster: serie.poster,
        type: 'series'
      }))
    ];

    // Trier par pertinence (titre exact en premier, puis par année)
    results.sort((a, b) => {
      const aExactMatch = a.title.toLowerCase() === query.toLowerCase();
      const bExactMatch = b.title.toLowerCase() === query.toLowerCase();
      
      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;
      
      return (b.year || 0) - (a.year || 0);
    });

    return NextResponse.json({
      success: true,
      results: results.slice(0, 20) // Limiter à 20 résultats
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la recherche' 
      },
      { status: 500 }
    );
  }
}
