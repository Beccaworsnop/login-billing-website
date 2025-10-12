import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import userRoutes from './routes/users';
import authRoutes from './routes/auth';
import transactionRoutes from './routes/transactions';
import paymentMethodRoutes from './routes/payment-methods';
import settingsRoutes from './routes/settings';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic routes
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Billing Backend API is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', service: 'Billing Backend API' });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/settings', settingsRoutes);

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`👥 Users API: http://localhost:${PORT}/api/users`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`💰 Transactions API: http://localhost:${PORT}/api/transactions`);
  console.log(`💳 Payments API: http://localhost:${PORT}/api/payment-methods`);
  console.log(`⚙️ Settings API: http://localhost:${PORT}/api/settings`);
});