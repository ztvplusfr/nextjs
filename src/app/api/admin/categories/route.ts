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

  let decoded: { userId: number };
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: number };
  } catch {
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

    const where: {
      OR?: Array<{
        name?: { contains: string; mode?: 'insensitive' };
        description?: { contains: string; mode?: 'insensitive' };
      }>;
    } = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        include: {
          movies: true,
          series: true,
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
      prisma.category.count({ where })
    ]);

    return NextResponse.json({
      categories,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Admin categories GET error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des catégories' },
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
      name,
      description,
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
    const existingCategory = await prisma.category.findFirst({
      where: {
        OR: [
          { name },
          { slug: finalSlug }
        ]
      }
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Une catégorie avec ce nom ou slug existe déjà' },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        description,
        slug: finalSlug,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    return NextResponse.json({ category }, { status: 201 });

  } catch (error) {
    console.error('Admin categories POST error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la catégorie' },
      { status: 500 }
    );
  }
}
