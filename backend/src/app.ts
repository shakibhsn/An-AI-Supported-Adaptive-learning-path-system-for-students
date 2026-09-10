import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import apiRoutes from './routes/index';
import { errorHandler } from './middleware/auth.middleware';

export const app = express();

app.use(cors());
app.use(express.json());

// Rate limit AI endpoints specifically - they're the most expensive calls
// (real LLM API usage) and the most abuse-prone. Section 28 requirement.
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: { error: 'Too many AI requests. Please wait a moment and try again.' },
});
app.use('/api/ai', aiLimiter);

app.get('/health', (_req, res) => res.json({ status: 'healthy' }));
app.use('/api', apiRoutes);

app.use(errorHandler);
