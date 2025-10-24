import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// Fonction pour créer une nouvelle instance Prisma
function createPrismaClient() {
  return new PrismaClient({
    log: ['warn', 'error'], // Réduire les logs en production
    errorFormat: 'minimal', // Format d'erreur minimal
  });
}

// Instance partagée avec gestion de reconnexion
export const prisma = global.prisma || createPrismaClient();

// En développement, partager l'instance globalement
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Gestionnaire de déconnexion propre
export async function disconnectPrisma() {
  if (global.prisma) {
    await global.prisma.$disconnect();
    global.prisma = undefined;
  }
}

// Fonction utilitaire pour s'assurer que Prisma est connecté
export async function ensurePrismaConnected() {
  try {
    await prisma.$connect();
  } catch (error) {
    console.error('Erreur de connexion Prisma:', error);
    throw error;
  }
}