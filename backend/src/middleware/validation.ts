import { Request, Response, NextFunction } from 'express';


export const validateRegistration = (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body;
  const errors: string[] = [];

  
  if (!name || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  if (!email || !isValidEmail(email)) {
    errors.push('Valid email is required');
  }

  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors 
    });
  }

  next();
};


export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  const errors: string[] = [];

  if (!email || !isValidEmail(email)) {
    errors.push('Valid email is required');
  }

  if (!password || password.trim().length === 0) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors 
    });
  }

  next();
};


export const validateTransaction = (req: Request, res: Response, next: NextFunction) => {
  const { amount, methodId } = req.body;
  const errors: string[] = [];

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    errors.push('Amount must be a positive number');
  }

  if (!methodId || typeof methodId !== 'string') {
    errors.push('Payment method ID is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors 
    });
  }

  next();
};


export const validatePaymentMethod = (req: Request, res: Response, next: NextFunction) => {
  const { type, provider, last4Digits } = req.body;
  const errors: string[] = [];

  if (!type || !['credit_card', 'debit_card', 'bank_account'].includes(type)) {
    errors.push('Valid payment type is required (credit_card, debit_card, bank_account)');
  }

  if (!provider || provider.trim().length < 2) {
    errors.push('Payment provider is required');
  }

  if (!last4Digits || !/^\d{4}$/.test(last4Digits)) {
    errors.push('Last 4 digits must be exactly 4 numbers');
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors 
    });
  }

  next();
};

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};