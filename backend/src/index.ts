import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { analyzeItemImageRouter } from './routes/analyze-item-image';
import { generatePromptRouter } from './routes/generate-prompt';
import { generateMaskImageRouter } from './routes/generate-mask-image';
import { generateItemImageRouter } from './routes/generate-item-image';
import { removeBackgroundRouter } from './routes/remove-background';
import { generateRouter } from './routes/generate';

// Load environment variables
dotenv.config();

// Environment variables validation
console.log('Environment check:');
console.log('- OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? `Set (${process.env.OPENAI_API_KEY.substring(0, 10)}...)` : 'Missing');
console.log('- GCS_BUCKET_NAME:', process.env.GCS_BUCKET_NAME || 'Not set');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'Not set');
console.log('- Working directory:', process.cwd());

const app = express();
const PORT = process.env.PORT || 8080;

// CORS設定（開発環境）
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://azuki-generator.vercel.app'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'azuki-backend' });
});

// API Routes
app.use('/api/analyze-item-image', analyzeItemImageRouter);
app.use('/api/generate-prompt', generatePromptRouter);
app.use('/api/generate-mask-image', generateMaskImageRouter);
app.use('/api/generate-item-image', generateItemImageRouter);
app.use('/api/remove-background', removeBackgroundRouter);
app.use('/api/generate', generateRouter);

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});