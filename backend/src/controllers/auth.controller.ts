import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../config/database';
import { logger } from '../utils/logger';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }

    // Hash password if provided
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword || '',
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      res.status(500).json({ error: 'JWT secret not configured' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token,
    });
  } catch (error) {
    logger.error('Registration error', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    logger.debug('Login attempt', { email });
    
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Verify password (skip if user has no password - OAuth user)
    if (!user.password) {
      res.status(401).json({ error: 'Please sign in with Google or set a password' });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET is missing from environment variables');
      res.status(500).json({ error: 'JWT secret not configured' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error: any) {
    logger.error('Login error', {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ 
      error: 'Failed to login',
      message: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    logger.error('Get profile error', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { name, phone, profileImage, bio } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone || null;
    if (profileImage !== undefined) updateData.profileImage = profileImage || null;
    if (bio !== undefined) updateData.bio = bio || null;

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        profileImage: true,
        bio: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.debug('Profile updated', { userId, updatedFields: Object.keys(updateData) });

    res.json({
      message: 'Profile updated successfully',
      user,
    });
  } catch (error: any) {
    logger.error('Update profile error', {
      error: error.message,
      userId: (req as any).userId,
    });
    res.status(500).json({ error: 'Failed to update profile', message: error.message });
  }
};

export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      res.status(400).json({ error: 'Google ID token is required' });
      return;
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      logger.error('GOOGLE_CLIENT_ID is missing from environment variables');
      res.status(500).json({ error: 'Google OAuth not configured' });
      return;
    }

    const client = new OAuth2Client(clientId);

    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken,
        audience: clientId,
      });
    } catch (error: any) {
      logger.error('Google token verification failed', { error: error.message });
      res.status(401).json({ error: 'Invalid Google token' });
      return;
    }

    const payload = ticket.getPayload();
    if (!payload) {
      res.status(401).json({ error: 'Invalid Google token payload' });
      return;
    }

    const { sub: googleId, email, name, picture } = payload;

    if (!email || !googleId) {
      res.status(400).json({ error: 'Google account missing required information' });
      return;
    }

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId },
          { email },
        ],
      },
    });

    if (user) {
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId,
            emailVerified: true,
            profileImage: picture || user.profileImage,
            name: name || user.name,
          },
        });
      } else if (picture && picture !== user.profileImage) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            profileImage: picture,
            name: name || user.name,
          },
        });
      }
    } else {
      user = await prisma.user.create({
        data: {
          googleId,
          email,
          name: name || email.split('@')[0],
          profileImage: picture || null,
          emailVerified: true,
          password: '',
        },
      });
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      res.status(500).json({ error: 'JWT secret not configured' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    logger.debug('Google login successful', { userId: user.id, email: user.email });

    res.json({
      message: 'Google login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
      },
      token,
    });
  } catch (error: any) {
    logger.error('Google login error', {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      error: 'Failed to login with Google',
      message: process.env.NODE_ENV === 'development' ? error?.message : undefined,
    });
  }
};

