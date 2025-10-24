import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export async function GET() {
  try {
    const genres = await prisma.genre.findMany({
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({
      success: true,
      data: genres
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des genres:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
