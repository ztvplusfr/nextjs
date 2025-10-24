import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';

// Configuration Cloudinary
if (!process.env.CLOUDINARY_API_KEY) {
  console.error('CLOUDINARY_API_KEY is not set in environment variables');
}
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


export async function POST(request: NextRequest) {
  try {
    // S'assurer que Prisma est connecté// Vérifier l'authentification
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Vérifier le JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    } catch (error) {
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 401 }
      );
    }

    // Récupérer le fichier avatar
    const formData = await request.formData();
    const avatarFile = formData.get('avatar') as File | null;

    let avatarPath: string;

    if (!avatarFile || avatarFile.size === 0) {
      return NextResponse.json(
        { error: 'Aucun fichier avatar fourni' },
        { status: 400 }
      );
    }

    // Validation du fichier
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (avatarFile.size > maxSize) {
      return NextResponse.json(
        { error: 'Le fichier avatar ne doit pas dépasser 5MB' },
        { status: 400 }
      );
    }

    // Validation du type de fichier
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(avatarFile.type)) {
      return NextResponse.json(
        { error: 'Format de fichier non supporté. Utilisez JPG, PNG, GIF ou WebP' },
        { status: 400 }
      );
    }

    // Récupérer l'utilisateur actuel
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { avatar: true }
    });

    // Supprimer l'ancien avatar de Cloudinary s'il existe
    if (user?.avatar && user.avatar.startsWith('https://res.cloudinary.com/')) {
      try {
        // Extraire le public_id de l'URL Cloudinary
        const urlParts = user.avatar.split('/');
        const publicIdWithExtension = urlParts[urlParts.length - 1];
        const publicId = `avatars/${publicIdWithExtension.split('.')[0]}`;

        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.log('Erreur suppression ancien avatar Cloudinary:', error);
      }
    }

    try {
      // Convertir le fichier en buffer
      const bytes = await avatarFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Upload vers Cloudinary
      const uploadResult = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: 'avatars',
            public_id: `${Date.now()}-${Math.random().toString(36).substring(2)}`,
            resource_type: 'image',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });

      avatarPath = uploadResult.secure_url;
    } catch (uploadError) {
      console.error('Erreur upload Cloudinary:', uploadError);
      return NextResponse.json(
        { error: 'Erreur lors du téléchargement de l\'avatar' },
        { status: 500 }
      );
    }

    // Mettre à jour l'avatar en base de données
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { avatar: avatarPath }
    });

    return NextResponse.json(
      { 
        message: 'Avatar mis à jour avec succès',
        avatar: avatarPath
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Avatar update error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'avatar' },
      { status: 500 }
    );
  }
}
