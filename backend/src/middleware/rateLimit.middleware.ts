import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  message: { error: 'Too many authentication attempts. Please wait 1 minute before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120, // 120 requests per minute
  message: { error: 'Rate limit exceeded. Please slow down your requests.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30, // 30 AI requests per minute
  message: { error: 'AI Gateway rate limit exceeded. Maximum 30 requests per minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});
