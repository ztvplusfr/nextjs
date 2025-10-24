import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const movieId = parseInt(id);

    if (isNaN(movieId)) {
      return NextResponse.json(
        { success: false, error: 'ID de film invalide' },
        { status: 400 }
      );
    }

    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
      include: {
        genres: {
          include: {
            genre: true
          }
        },
        category: true,
      },
    });

    if (!movie) {
      return NextResponse.json(
        { success: false, error: 'Film non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: movie,
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du film:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération du film' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const movieId = parseInt(id);
    const body = await request.json();

    if (isNaN(movieId)) {
      return NextResponse.json(
        { success: false, error: 'ID de film invalide' },
        { status: 400 }
      );
    }

    const {
      title,
      originalTitle,
      description,
      year,
      rating,
      duration,
      poster,
      backdrop,
      trailer,
      releaseDate,
      isActive,
      isFeatured,
      genres,
      categories
    } = body;

    // Vérifier que le film existe
    const existingMovie = await prisma.movie.findUnique({
      where: { id: movieId }
    });

    if (!existingMovie) {
      return NextResponse.json(
        { success: false, error: 'Film non trouvé' },
        { status: 404 }
      );
    }

    // Mettre à jour le film
    const updatedMovie = await prisma.movie.update({
      where: { id: movieId },
      data: {
        title,
        originalTitle,
        description,
        year,
        rating,
        duration,
        poster,
        backdrop,
        trailer,
        releaseDate: releaseDate ? new Date(releaseDate) : null,
        isActive: isActive ?? true,
        isFeatured: isFeatured ?? false,
        updatedAt: new Date(),
      },
      include: {
        genres: {
          include: {
            genre: true
          }
        },
        category: true,
      },
    });

    // Mettre à jour les genres si fournis
    if (genres && Array.isArray(genres)) {
      // D'abord, supprimer toutes les relations existantes
      await prisma.movieGenre.deleteMany({
        where: { movieId: movieId }
      });
      
      // Puis créer les nouvelles relations
      await prisma.movieGenre.createMany({
        data: genres.map((genreId: number) => ({
          movieId: movieId,
          genreId: genreId
        }))
      });
    }

    // Mettre à jour la catégorie si fournie
    if (categories && Array.isArray(categories) && categories.length > 0) {
      await prisma.movie.update({
        where: { id: movieId },
        data: {
          category: {
            connect: { id: categories[0] }
          }
        }
      });
    }

    // Récupérer le film complet avec les genres mis à jour
    const finalMovie = await prisma.movie.findUnique({
      where: { id: movieId },
      include: {
        genres: {
          include: {
            genre: true
          }
        },
        category: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: finalMovie,
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du film:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la mise à jour du film' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const movieId = parseInt(id);

    if (isNaN(movieId)) {
      return NextResponse.json(
        { success: false, error: 'ID de film invalide' },
        { status: 400 }
      );
    }

    // Vérifier que le film existe
    const existingMovie = await prisma.movie.findUnique({
      where: { id: movieId }
    });

    if (!existingMovie) {
      return NextResponse.json(
        { success: false, error: 'Film non trouvé' },
        { status: 404 }
      );
    }

    // Supprimer le film
    await prisma.movie.delete({
      where: { id: movieId }
    });

    return NextResponse.json({
      success: true,
      message: 'Film supprimé avec succès',
    });

  } catch (error) {
    console.error('Erreur lors de la suppression du film:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la suppression du film' 
      },
      { status: 500 }
    );
  }
}
