/**
 * Mock Java API Server
 * This file provides mock implementations of the Java backend API endpoints
 * for local development and testing when the Java backend is not available.
 */

import express from 'express';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './storage';

// Create a router for the mock Java API endpoints
const mockJavaApiRouter = express.Router();

// JWT secret for mock authentication
const JWT_SECRET = 'mock-java-backend-secret';
const JWT_EXPIRY = '24h';

// Middleware to handle authentication
const authenticateJWT = (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({
          status: 403,
          timestamp: new Date().toISOString(),
          message: 'Invalid or expired token',
          error: 'Forbidden'
        });
      }

      // @ts-ignore
      req.user = user;
      next();
    });
  } else {
    res.status(401).json({
      status: 401,
      timestamp: new Date().toISOString(),
      message: 'Authentication required',
      error: 'Unauthorized'
    });
  }
};

// Authentication endpoints

// Login
mockJavaApiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { usernameOrEmail, password } = req.body;

    // In a real app, we would validate credentials against the database
    // For now, let's just mock this with a basic check
    if (!usernameOrEmail || !password) {
      return res.status(400).json({
        status: 400,
        timestamp: new Date().toISOString(),
        message: 'Username/email and password are required',
        error: 'Bad Request'
      });
    }

    // Find user by username or email
    const user = await db.user.findFirst({
      where: {
        OR: [
          { username: usernameOrEmail },
          { email: usernameOrEmail }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({
        status: 401,
        timestamp: new Date().toISOString(),
        message: 'Invalid credentials',
        error: 'Unauthorized'
      });
    }

    // In a real app, we would check the password hash
    // For mock purposes, we'll just check if user exists

    // Generate JWT token
    const accessToken = jwt.sign(
      { 
        sub: user.id.toString(), 
        username: user.username, 
        email: user.email,
        roles: ['USER'] 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    // Generate refresh token (in real app, this would be stored in DB)
    const refreshToken = jwt.sign(
      { sub: user.id.toString() },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 86400, // 24 hours in seconds
      userId: user.id,
      username: user.username,
      email: user.email,
      roles: ['USER']
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 500,
      timestamp: new Date().toISOString(),
      message: 'An error occurred during login',
      error: 'Internal Server Error'
    });
  }
});

// Register
mockJavaApiRouter.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    // Basic validation
    if (!username || !email || !password) {
      return res.status(400).json({
        status: 400,
        timestamp: new Date().toISOString(),
        message: 'Username, email, and password are required',
        error: 'Bad Request'
      });
    }

    // Check if user already exists
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        status: 400,
        timestamp: new Date().toISOString(),
        message: 'Username or email already in use',
        error: 'Bad Request'
      });
    }

    // Create new user
    const newUser = await db.user.create({
      data: {
        username,
        email,
        firstName: firstName || null,
        lastName: lastName || null,
        password: 'hashed_password_would_go_here' // In real app, we'd hash the password
      }
    });

    // Generate JWT token
    const accessToken = jwt.sign(
      { 
        sub: newUser.id.toString(), 
        username: newUser.username, 
        email: newUser.email,
        roles: ['USER'] 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { sub: newUser.id.toString() },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 86400, // 24 hours in seconds
      userId: newUser.id,
      username: newUser.username,
      email: newUser.email,
      roles: ['USER']
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      status: 500,
      timestamp: new Date().toISOString(),
      message: 'An error occurred during registration',
      error: 'Internal Server Error'
    });
  }
});

// Logout
mockJavaApiRouter.post('/auth/logout', authenticateJWT, (req: Request, res: Response) => {
  // In a real app, we would invalidate the token in the database
  // For mock purposes, we'll just return a success response
  res.status(204).send();
});

// Refresh token
mockJavaApiRouter.post('/auth/refresh-token', (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      status: 400,
      timestamp: new Date().toISOString(),
      message: 'Refresh token is required',
      error: 'Bad Request'
    });
  }

  try {
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as jwt.JwtPayload;
    
    if (!decoded || !decoded.sub) {
      return res.status(403).json({
        status: 403,
        timestamp: new Date().toISOString(),
        message: 'Invalid refresh token',
        error: 'Forbidden'
      });
    }

    // Get the user ID from the token
    const userId = parseInt(decoded.sub as string, 10);

    // Find the user in the database
    db.user.findUnique({ where: { id: userId } })
      .then(user => {
        if (!user) {
          return res.status(404).json({
            status: 404,
            timestamp: new Date().toISOString(),
            message: 'User not found',
            error: 'Not Found'
          });
        }

        // Generate a new access token
        const accessToken = jwt.sign(
          { 
            sub: user.id.toString(), 
            username: user.username, 
            email: user.email,
            roles: ['USER'] 
          },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRY }
        );

        // Generate a new refresh token
        const newRefreshToken = jwt.sign(
          { sub: user.id.toString() },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        res.json({
          accessToken,
          refreshToken: newRefreshToken,
          tokenType: 'Bearer',
          expiresIn: 86400, // 24 hours in seconds
          userId: user.id,
          username: user.username,
          email: user.email,
          roles: ['USER']
        });
      })
      .catch(error => {
        console.error('Error finding user:', error);
        res.status(500).json({
          status: 500,
          timestamp: new Date().toISOString(),
          message: 'An error occurred while refreshing token',
          error: 'Internal Server Error'
        });
      });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(403).json({
      status: 403,
      timestamp: new Date().toISOString(),
      message: 'Invalid refresh token',
      error: 'Forbidden'
    });
  }
});

// Password reset request
mockJavaApiRouter.post('/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      status: 400,
      timestamp: new Date().toISOString(),
      message: 'Email is required',
      error: 'Bad Request'
    });
  }

  // In a real app, we would check if the email exists and send a reset link
  // For mock purposes, we'll just return a success response
  res.status(204).send();
});

// Reset password with token
mockJavaApiRouter.post('/auth/reset-password', (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({
      status: 400,
      timestamp: new Date().toISOString(),
      message: 'Token and new password are required',
      error: 'Bad Request'
    });
  }

  // In a real app, we would verify the token and update the password
  // For mock purposes, we'll just return a success response
  res.status(204).send();
});

// User endpoints

// Get current user
mockJavaApiRouter.get('/user', authenticateJWT, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = parseInt(req.user.sub, 10);

    const user = await db.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        status: 404,
        timestamp: new Date().toISOString(),
        message: 'User not found',
        error: 'Not Found'
      });
    }

    // Don't return the password field
    const { password, ...userWithoutPassword } = user;

    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      status: 500,
      timestamp: new Date().toISOString(),
      message: 'An error occurred while fetching user',
      error: 'Internal Server Error'
    });
  }
});

// Update user profile
mockJavaApiRouter.put('/user/profile', authenticateJWT, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = parseInt(req.user.sub, 10);
    const { firstName, lastName, location, email } = req.body;

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        firstName: firstName !== undefined ? firstName : undefined,
        lastName: lastName !== undefined ? lastName : undefined,
        location: location !== undefined ? location : undefined,
        email: email !== undefined ? email : undefined,
      }
    });

    // Don't return the password field
    const { password, ...userWithoutPassword } = updatedUser;

    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      status: 500,
      timestamp: new Date().toISOString(),
      message: 'An error occurred while updating profile',
      error: 'Internal Server Error'
    });
  }
});

// Change password
mockJavaApiRouter.post('/user/change-password', authenticateJWT, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = parseInt(req.user.sub, 10);
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 400,
        timestamp: new Date().toISOString(),
        message: 'Current password and new password are required',
        error: 'Bad Request'
      });
    }

    // In a real app, we would verify the current password
    // For mock purposes, we'll just update the password

    await db.user.update({
      where: { id: userId },
      data: {
        password: 'new_hashed_password_would_go_here'
      }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      status: 500,
      timestamp: new Date().toISOString(),
      message: 'An error occurred while changing password',
      error: 'Internal Server Error'
    });
  }
});

// Skills endpoints

// Get user skills
mockJavaApiRouter.get('/skills/user', authenticateJWT, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = parseInt(req.user.sub, 10);

    const skills = await db.skill.findMany({
      where: { userId }
    });

    res.json(skills);
  } catch (error) {
    console.error('Error fetching skills:', error);
    res.status(500).json({
      status: 500,
      timestamp: new Date().toISOString(),
      message: 'An error occurred while fetching skills',
      error: 'Internal Server Error'
    });
  }
});

// Add more mock endpoints as needed for skills, projects, etc.

// Export the router for use in the main server
export default mockJavaApiRouter;