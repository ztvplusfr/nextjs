import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Nettoie les tokens de réinitialisation expirés
 * Supprime les tokens vieux de plus de 5 minutes
 */
export async function cleanupExpiredPasswordResetTokens() {
  try {
    const deletedTokens = await prisma.passwordReset.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        },
        used: false
      }
    });

    console.log(`Nettoyé ${deletedTokens.count} tokens expirés`);

    return deletedTokens.count;
  } catch (error) {
    console.error('Erreur lors du nettoyage des tokens:', error);
    throw error;
  }
}

/**
 * Nettoie tous les tokens utilisés (qu'ils soient expirés ou non)
 */
export async function cleanupUsedPasswordResetTokens() {
  try {
    const deletedTokens = await prisma.passwordReset.deleteMany({
      where: {
        used: true
      }
    });

    console.log(`Nettoyé ${deletedTokens.count} tokens utilisés`);

    return deletedTokens.count;
  } catch (error) {
    console.error('Erreur lors du nettoyage des tokens utilisés:', error);
    throw error;
  }
}

/**
 * Nettoie tous les tokens (expirés et utilisés)
 */
export async function cleanupAllPasswordResetTokens() {
  try {
    const deletedTokens = await prisma.passwordReset.deleteMany({
      where: {
        OR: [
          {
            expiresAt: {
              lt: new Date()
            },
            used: false
          },
          {
            used: true
          }
        ]
      }
    });

    console.log(`Nettoyé ${deletedTokens.count} tokens au total`);

    return deletedTokens.count;
  } catch (error) {
    console.error('Erreur lors du nettoyage complet:', error);
    throw error;
  }
}
