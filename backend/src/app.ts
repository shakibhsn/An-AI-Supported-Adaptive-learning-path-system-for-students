import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import apiRoutes from './routes/index';
import { errorHandler } from './middleware/auth.middleware';

export const app = express();

// Security headers (Section 26). API-only, so the restrictive defaults are fine.
app.use(helmet());

// CORS locked to the known frontend origin(s) - comma-separated env var,
// defaults to the local dev server. "*" is no longer used.
const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
app.use(
  cors({
    origin(origin, cb) {
      // allow same-origin / curl / server-to-server (no Origin header)
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
  }),
);

app.use(express.json({ limit: '256kb' }));

// Rate limit AI endpoints specifically - they're the most expensive calls
// (real LLM API usage) and the most abuse-prone. Section 28 requirement.
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many AI requests. Please wait a moment and try again.' },
});
app.use('/api/ai', aiLimiter);

// A gentler global limiter for everything else (auth brute-force, scraping).
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});
app.use('/api', globalLimiter);

app.get('/health', (_req, res) => res.json({ status: 'healthy' }));
app.use('/api', apiRoutes);

app.use(errorHandler);
