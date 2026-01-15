import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/auth';
import { query } from '../config/database';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

// JWT authentication middleware
export const authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
      });
      return;
    }

    const token = authHeader.substring(7);
    const payload: JWTPayload = verifyToken(token);

    // Verify user still exists in database
    const result = await query(
      'SELECT id, email FROM users WHERE id = $1',
      [payload.userId]
    );

    if (result.rows.length === 0) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found',
      });
      return;
    }

    req.user = {
      userId: payload.userId,
      email: payload.email,
    };

    next();
  } catch (error) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
};

// API token authentication middleware (for Chrome extension)
export const authenticateApiToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiToken = req.headers['x-api-token'] as string;

    if (!apiToken) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing API token',
      });
      return;
    }

    // Find user by API token
    const result = await query(
      'SELECT id, email FROM users WHERE api_token = $1',
      [apiToken]
    );

    if (result.rows.length === 0) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid API token',
      });
      return;
    }

    req.user = {
      userId: result.rows[0].id,
      email: result.rows[0].email,
    };

    next();
  } catch (error) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication failed',
    });
  }
};

// Combined authentication middleware (tries JWT first, then API token)
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const apiToken = req.headers['x-api-token'];

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticateJWT(req, res, next);
  } else if (apiToken) {
    return authenticateApiToken(req, res, next);
  } else {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'No authentication credentials provided',
    });
  }
};
