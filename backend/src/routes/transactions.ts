import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';
import { validateTransaction } from '../middleware/validation';

const router = express.Router();
const prisma = new PrismaClient();


router.use(requireAuth);


router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { page = 1, limit = 10, status } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { userId };

   
    if (status && typeof status === 'string') {
      where.status = status;
    }

    
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        paymentMethod: {
          select: {
            type: true,
            provider: true,
            last4Digits: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: Number(limit)
    });

    
    const totalCount = await prisma.transaction.count({ where });

    res.json({
      transactions,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalCount / Number(limit)),
        totalCount,
        hasMore: skip + transactions.length < totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId 
      },
      include: {
        paymentMethod: {
          select: {
            type: true,
            provider: true,
            last4Digits: true
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ transaction });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

router.post('/', validateTransaction, async (req: Request, res: Response) => {
  try {
    const { amount, methodId, description } = req.body;
    const userId = req.user!.userId;

    const paymentMethod = await prisma.paymentMethod.findFirst({
      where: {
        id: methodId,
        userId,
        isActive: true
      }
    });

    if (!paymentMethod) {
      return res.status(404).json({ error: 'Payment method not found or inactive' });
    }

 
    const userSettings = await prisma.accountSetting.findUnique({
      where: { userId }
    });

    if (userSettings) {
    
      if (amount > userSettings.maxSingleTransaction) {
        return res.status(400).json({ 
          error: `Transaction amount exceeds your limit of $${userSettings.maxSingleTransaction}` 
        });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todaysTransactions = await prisma.transaction.aggregate({
        where: {
          userId,
          createdAt: {
            gte: today,
            lt: tomorrow
          },
          status: { not: 'failed' }
        },
        _sum: {
          amount: true
        }
      });

      const todaysTotal = todaysTransactions._sum.amount || 0;
      if (todaysTotal + amount > userSettings.dailyLimit) {
        return res.status(400).json({ 
          error: `Transaction would exceed your daily limit of $${userSettings.dailyLimit}` 
        });
      }
    }

    const transaction = await prisma.transaction.create({
      data: {
        amount,
        methodId,
        status: 'pending',
        userId
      },
      include: {
        paymentMethod: {
          select: {
            type: true,
            provider: true,
            last4Digits: true
          }
        }
      }
    });

    setTimeout(async () => {
      try {
        const isSuccessful = Math.random() > 0.1;
        const newStatus = isSuccessful ? 'completed' : 'failed';

        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { status: newStatus }
        });

        await prisma.activityLog.create({
          data: {
            userId,
            action: `transaction_${newStatus}`,
            details: JSON.stringify({
              transactionId: transaction.id,
              amount,
              paymentMethod: paymentMethod.type
            })
          }
        });
      } catch (error) {
        console.error('Error updating transaction status:', error);
      }
    }, 2000); 

    res.status(201).json({
      message: 'Transaction created successfully',
      transaction
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

router.put('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId,
        status: 'pending' 
      }
    });

    if (!transaction) {
      return res.status(404).json({ 
        error: 'Transaction not found or cannot be cancelled' 
      });
    }

   
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: { status: 'cancelled' },
      include: {
        paymentMethod: {
          select: {
            type: true,
            provider: true,
            last4Digits: true
          }
        }
      }
    });

    
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'transaction_cancelled',
        details: JSON.stringify({
          transactionId: id,
          amount: transaction.amount
        })
      }
    });

    res.json({
      message: 'Transaction cancelled successfully',
      transaction: updatedTransaction
    });
  } catch (error) {
    console.error('Error cancelling transaction:', error);
    res.status(500).json({ error: 'Failed to cancel transaction' });
  }
});


router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const statusCounts = await prisma.transaction.groupBy({
      by: ['status'],
      where: { userId },
      _count: {
        status: true
      },
      _sum: {
        amount: true
      }
    });

   
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const monthlySpending = await prisma.transaction.aggregate({
      where: {
        userId,
        createdAt: {
          gte: lastMonth
        },
        status: 'completed'
      },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    });

    res.json({
      statusBreakdown: statusCounts,
      monthlyStats: {
        totalSpent: monthlySpending._sum.amount || 0,
        transactionCount: monthlySpending._count.id || 0
      }
    });
  } catch (error) {
    console.error('Error fetching transaction stats:', error);
    res.status(500).json({ error: 'Failed to fetch transaction statistics' });
  }
});

export default router;