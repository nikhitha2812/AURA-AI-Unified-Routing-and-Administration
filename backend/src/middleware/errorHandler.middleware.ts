import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Server Error:', err);

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  const safeMessage = process.env.NODE_ENV === 'production'
    ? 'An unexpected service error occurred. Please try again later.'
    : err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: safeMessage,
    status: statusCode,
  });
};
