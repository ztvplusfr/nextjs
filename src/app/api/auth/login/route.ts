import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
import { randomBytes } from 'crypto';

// POST /api/auth/login
export async function POST(request: NextRequest) {
  try {
    const { emailOrUsername, password } = await request.json();

    // Validation
    if (!emailOrUsername || !password) {
      return NextResponse.json(
        { error: 'Email/nom d\'utilisateur et mot de passe sont requis' },
        { status: 400 }
      );
    }

    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: { 
        OR: [
          { email: emailOrUsername },
          { username: emailOrUsername }
        ]
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        password: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Compte désactivé' },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Mot de passe incorrect' },
        { status: 401 }
      );
    }

    // Vérifier la limite de sessions (4 maximum)
    const existingSessions = await prisma.session.findMany({
      where: {
        userId: user.id,
        expiresAt: {
          gt: new Date() // Sessions non expirées
        }
      }
    });

    if (existingSessions.length >= 4) {
      return NextResponse.json(
        { 
          error: 'Limite de sessions atteinte',
          message: 'Vous avez déjà 4 sessions actives. Veuillez supprimer une session existante pour vous connecter.',
          sessionLimit: true
        },
        { status: 403 }
      );
    }

    // Create JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Generate session token
    const sessionToken = randomBytes(32).toString('hex');
    
    // Get client information
    const userAgent = request.headers.get('user-agent') || '';
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    
    // Parse user agent for device info
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    const isTablet = /iPad|Tablet/.test(userAgent);
    const device = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';
    
    // Extract browser info
    let browser = 'Unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    
    // Extract OS info
    let os = 'Unknown';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';

    // Create session in database
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: sessionToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        ipAddress,
        userAgent,
        device,
        browser,
        os,
      },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Set HTTP-only cookie
    const response = NextResponse.json(
      {
        message: 'Connexion réussie',
        user: userWithoutPassword,
        token,
        sessionId: session.id,
      },
      { status: 200 }
    );

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    response.cookies.set('session-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
