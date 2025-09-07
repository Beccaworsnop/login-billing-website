import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/users';
import authRoutes from './routes/auth';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Your Next.js frontend URL
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'Billing Backend API is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', service: 'Billing Backend API' });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/auth', authRoutes);


// 404 handler (catch-all)
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});


// Error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/health`);
  console.log(` Users API: http://localhost:${PORT}/api/users`);
  console.log(` auth API: http://localhost:${PORT}/api/auth`);

});