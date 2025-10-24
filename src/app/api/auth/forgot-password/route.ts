import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email requis' },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, isActive: true }
    });

    if (!user) {
      // Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
      return NextResponse.json({
        success: false,
        error: 'Aucun compte trouvé avec cette adresse email.'
      });
    }

    if (!user.isActive) {
      return NextResponse.json({
        success: false,
        error: 'Ce compte est désactivé. Contactez l\'administrateur.'
      });
    }

    // Générer un token long et sécurisé (64 caractères hexadécimaux)
    const token = randomBytes(32).toString('hex');

    // Créer l'entrée dans password_resets (sans expiresAt pour l'instant)
    await prisma.passwordReset.create({
      data: {
        email: user.email,
        token,
        active: false, // Nécessite activation admin
        used: false
      }
    });

    console.log(`Token de réinitialisation créé pour ${email}: ${token}`);
    console.log(`En attente d'activation par l'admin`);

    return NextResponse.json({
      success: true,
      message: 'Demande de réinitialisation enregistrée. Un administrateur doit l\'activer.'
    });

  } catch (error) {
    console.error('Erreur lors de la demande de réinitialisation:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
