import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../lib/jwt';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    tenantId?: string;
  };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: 'Missing Authorization header' });

  const [, token] = header.split(' ');
  if (!token) return res.status(401).json({ message: 'Invalid Authorization header' });

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, role: payload.role, tenantId: payload.tenantId };
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
