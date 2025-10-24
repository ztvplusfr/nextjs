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

export async function GET(request: NextRequest) {
  try {
    const authCheck = await checkAdminAuth(request);
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [genres, total] = await Promise.all([
      prisma.genre.findMany({
        where,
        include: {
          movies: {
            include: { movie: true }
          },
          series: {
            include: { series: true }
          },
          _count: {
            select: { 
              movies: true,
              series: true
            }
          }
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit
      }),
      prisma.genre.count({ where })
    ]);

    return NextResponse.json({
      genres,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Admin genres GET error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des genres' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await checkAdminAuth(request);
    if ('error' in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const {
      tmdbId,
      name,
      slug,
      isActive
    } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Le nom est requis' },
        { status: 400 }
      );
    }

    // Générer le slug s'il n'est pas fourni
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Vérifier si le nom ou slug existe déjà
    const existingGenre = await prisma.genre.findFirst({
      where: {
        OR: [
          { name },
          { slug: finalSlug }
        ]
      }
    });

    if (existingGenre) {
      return NextResponse.json(
        { error: 'Un genre avec ce nom ou slug existe déjà' },
        { status: 400 }
      );
    }

    // Vérifier si tmdbId existe déjà
    if (tmdbId) {
      const existingTmdbGenre = await prisma.genre.findUnique({
        where: { tmdbId }
      });

      if (existingTmdbGenre) {
        return NextResponse.json(
          { error: 'Un genre avec cet ID TMDB existe déjà' },
          { status: 400 }
        );
      }
    }

    const genre = await prisma.genre.create({
      data: {
        tmdbId,
        name,
        slug: finalSlug,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    return NextResponse.json({ genre }, { status: 201 });

  } catch (error) {
    console.error('Admin genres POST error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du genre' },
      { status: 500 }
    );
  }
}
