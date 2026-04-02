import { Request, Response, NextFunction } from 'express';

/**
 * Watcher API Key Authentication
 * Used by the external file-watcher service to call internal endpoints.
 * Set WATCHER_API_KEY in your .env file.
 */
export const authenticateWatcher = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const key = req.headers['x-watcher-key'];
  const expected = process.env.WATCHER_API_KEY;

  if (!expected) {
    console.error('WATCHER_API_KEY is not set in environment variables');
    res.status(500).json({ success: false, error: 'Watcher not configured on server' });
    return;
  }

  if (!key || key !== expected) {
    res.status(401).json({ success: false, error: 'Invalid watcher API key', code: 'INVALID_WATCHER_KEY' });
    return;
  }

  next();
};
