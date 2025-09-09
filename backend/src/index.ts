import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import userRoutes from './routes/users';
import authRoutes from './routes/auth';
import transactionRoutes from './routes/transactions';
import paymentMethodRoutes from './routes/payment-methods';
import settingsRoutes from './routes/settings'; // 👈 new import
import { testEmailConnection } from './utils/emails';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.get('/api/emails/test', async (req, res) => {
  try {
    const result = await testEmailConnection();
    res.json({ success: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});


app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/settings', settingsRoutes); // 👈 mounted new route

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err: any, req: Request, res: Response, next: any) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/health`);
  console.log(` Users API: http://localhost:${PORT}/api/users`);
  console.log(` Auth API: http://localhost:${PORT}/api/auth`);
  console.log(` Transactions API: http://localhost:${PORT}/api/transactions`);
  console.log(` Payments API: http://localhost:${PORT}/api/payment-methods`);
  console.log(` Settings API: http://localhost:${PORT}/api/settings`); // 👈 added log
});
