import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Token et nouveau mot de passe requis' },
        { status: 400 }
      );
    }

    // Vérifier la longueur du mot de passe
    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      );
    }

    // Trouver le token dans la base de données
    const resetToken = await prisma.passwordReset.findUnique({
      where: { token }
    });

    if (!resetToken) {
      return NextResponse.json(
        { success: false, error: 'Token invalide' },
        { status: 400 }
      );
    }

    // Vérifier si le token a déjà été utilisé
    if (resetToken.used) {
      return NextResponse.json(
        { success: false, error: 'Ce token a déjà été utilisé' },
        { status: 400 }
      );
    }

    // Vérifier si le token est activé
    if (!resetToken.active) {
      return NextResponse.json(
        { success: false, error: 'Ce token n\'est pas encore activé' },
        { status: 400 }
      );
    }

    // Vérifier si le token a une date d'expiration définie
    if (!resetToken.expiresAt) {
      return NextResponse.json(
        { success: false, error: 'Ce token n\'est pas encore activé' },
        { status: 400 }
      );
    }

    // Vérifier si le token n'a pas expiré
    if (new Date() > resetToken.expiresAt) {
      // Supprimer le token expiré
      await prisma.passwordReset.delete({
        where: { id: resetToken.id }
      });

      return NextResponse.json(
        { success: false, error: 'Ce token a expiré' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe toujours
    const user = await prisma.user.findUnique({
      where: { email: resetToken.email }
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur introuvable ou inactif' },
        { status: 400 }
      );
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Mettre à jour le mot de passe de l'utilisateur
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    // Marquer le token comme utilisé
    await prisma.passwordReset.update({
      where: { id: resetToken.id },
      data: { used: true }
    });

    // Supprimer tous les autres tokens actifs pour cet email (sécurité)
    await prisma.passwordReset.deleteMany({
      where: {
        email: resetToken.email,
        used: false
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
