import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export async function GET() {
  try {
    // S'assurer que Prisma est connecté// Récupérer les 10 meilleurs films triés par note décroissante
    const movies = await prisma.movie.findMany({
      where: {
        isActive: true,
        rating: { not: null }
      },
      select: {
        id: true,
        title: true,
        poster: true,
        year: true,
        rating: true,
        duration: true,
        releaseDate: true,
        videos: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        rating: 'desc'
      },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      data: movies
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des top 10 films:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erreur lors de la récupération des films' 
      },
      { status: 500 }
    );
  }
}
