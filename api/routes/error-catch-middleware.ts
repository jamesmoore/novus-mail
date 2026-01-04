import { Request, Response, NextFunction } from 'express';

export function errorCatchMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  console.error(err);

  res.status(500).json({
    error: `${req.method} ${req.url} failed`
  });
}