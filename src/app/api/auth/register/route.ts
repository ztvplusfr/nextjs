import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
import bcrypt from 'bcryptjs';
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
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const username = formData.get('username') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const timezone = formData.get('timezone') as string;
    const avatarFile = formData.get('avatar') as File | null;

    // Validation des données
    if (!name || !username || !email || !password) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      );
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Format d\'email invalide' },
        { status: 400 }
      );
    }

    // Validation du mot de passe
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur existe déjà (email ou username)
    const existingUser = await prisma.user.findFirst({
      where: { 
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json(
          { error: 'Un compte avec cet email existe déjà' },
          { status: 409 }
        );
      }
      if (existingUser.username === username) {
        return NextResponse.json(
          { error: 'Ce nom d\'utilisateur est déjà pris' },
          { status: 409 }
        );
      }
    }

    // Gestion de l'avatar
    let avatarPath = null;
    if (avatarFile && avatarFile.size > 0) {
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
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        name,
        username,
        email,
        password: hashedPassword,
        avatar: avatarPath,
        timezone: timezone,
        role: 'USER', // Rôle par défaut
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        avatar: true,
        timezone: true,
        role: true,
        isActive: true,
        createdAt: true,
      }
    });

    return NextResponse.json(
      { 
        message: 'Compte créé avec succès',
        user 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
