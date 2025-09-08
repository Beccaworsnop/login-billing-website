import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';
import { validatePaymentMethod } from '../middleware/validation';

const router = express.Router();
const prisma = new PrismaClient();

router.use(requireAuth);

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const paymentMethods = await prisma.paymentMethod.findMany({
      where: { userId },
      orderBy: { addedAt: 'desc' }
    });

    res.json({ paymentMethods });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ error: 'Failed to fetch payment methods' });
  }
});

router.post('/', validatePaymentMethod, async (req: Request, res: Response) => {
  try {
    const { type, provider, last4Digits } = req.body;
    const userId = req.user!.userId;

    const existingMethods = await prisma.paymentMethod.count({
      where: { userId, isActive: true }
    });

    const userSettings = await prisma.accountSetting.findUnique({
      where: { userId }
    });
    const limit = userSettings?.paymentMethodLimit || 5;

    if (existingMethods >= limit) {
      return res.status(400).json({ 
        error: `You can only have ${limit} active payment methods` 
      });
    }

    const paymentMethod = await prisma.paymentMethod.create({
      data: {
        type,
        provider,
        last4Digits,
        userId
      }
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'payment_method_added',
        details: JSON.stringify({
          paymentMethodId: paymentMethod.id,
          type,
          provider
        })
      }
    });

    res.status(201).json({
      message: 'Payment method added successfully',
      paymentMethod
    });
  } catch (error) {
    console.error('Error adding payment method:', error);
    res.status(500).json({ error: 'Failed to add payment method' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const paymentMethod = await prisma.paymentMethod.findFirst({
      where: { id, userId }
    });

    if (!paymentMethod) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    const pendingTransactions = await prisma.transaction.findFirst({
      where: {
        methodId: id,
        status: 'pending'
      }
    });

    if (pendingTransactions) {
      return res.status(400).json({ 
        error: 'Cannot delete payment method with pending transactions' 
      });
    }

    await prisma.paymentMethod.update({
      where: { id },
      data: { isActive: false }
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'payment_method_removed',
        details: JSON.stringify({
          paymentMethodId: id,
          type: paymentMethod.type
        })
      }
    });

    res.json({ message: 'Payment method removed successfully' });
  } catch (error) {
    console.error('Error removing payment method:', error);
    res.status(500).json({ error: 'Failed to remove payment method' });
  }
});

export default router;