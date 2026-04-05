import { Request, Response, NextFunction } from 'express';

// Extend express-session types
declare module 'express-session' {
  interface SessionData {
    userId: number;
    username: string;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  next();
}
