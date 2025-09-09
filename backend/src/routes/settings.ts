import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

router.use(requireAuth);

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    let settings = await prisma.accountSetting.findUnique({
      where: { userId }
    });

    if (!settings) {
      settings = await prisma.accountSetting.create({
        data: {
          userId,
          dailyLimit: 1000.00,
          monthlyLimit: 10000.00,
          maxSingleTransaction: 500.00,
          paymentMethodLimit: 5,
          privacySettings: JSON.stringify({
            shareDataWithPartners: false,
            allowMarketingEmails: false,
            showTransactionHistory: true
          }),
          dataRetention: '2_years'
        }
      });
    }

    const settingsWithParsedJSON = {
      ...settings,
      privacySettings: JSON.parse(settings.privacySettings)
    };

    res.json({ settings: settingsWithParsedJSON });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.put('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { 
      dailyLimit, 
      monthlyLimit, 
      maxSingleTransaction, 
      paymentMethodLimit, 
      privacySettings,
      dataRetention 
    } = req.body;

    const errors: string[] = [];

    if (dailyLimit !== undefined && (typeof dailyLimit !== 'number' || dailyLimit <= 0)) {
      errors.push('Daily limit must be a positive number');
    }

    if (monthlyLimit !== undefined && (typeof monthlyLimit !== 'number' || monthlyLimit <= 0)) {
      errors.push('Monthly limit must be a positive number');
    }

    if (maxSingleTransaction !== undefined && (typeof maxSingleTransaction !== 'number' || maxSingleTransaction <= 0)) {
      errors.push('Max single transaction must be a positive number');
    }

    if (paymentMethodLimit !== undefined && (typeof paymentMethodLimit !== 'number' || paymentMethodLimit < 1 || paymentMethodLimit > 10)) {
      errors.push('Payment method limit must be between 1 and 10');
    }

    if (dataRetention !== undefined && !['1_year', '2_years', '5_years', 'forever'].includes(dataRetention)) {
      errors.push('Data retention must be one of: 1_year, 2_years, 5_years, forever');
    }

    if (dailyLimit !== undefined && monthlyLimit !== undefined && dailyLimit > monthlyLimit) {
      errors.push('Daily limit cannot exceed monthly limit');
    }

    if (maxSingleTransaction !== undefined && dailyLimit !== undefined && maxSingleTransaction > dailyLimit) {
      errors.push('Max single transaction cannot exceed daily limit');
    }

    if (errors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors 
      });
    }

    const updateData: any = {};
    
    if (dailyLimit !== undefined) updateData.dailyLimit = dailyLimit;
    if (monthlyLimit !== undefined) updateData.monthlyLimit = monthlyLimit;
    if (maxSingleTransaction !== undefined) updateData.maxSingleTransaction = maxSingleTransaction;
    if (paymentMethodLimit !== undefined) updateData.paymentMethodLimit = paymentMethodLimit;
    if (dataRetention !== undefined) updateData.dataRetention = dataRetention;
    
    if (privacySettings !== undefined) {
      updateData.privacySettings = JSON.stringify(privacySettings);
    }

    const settings = await prisma.accountSetting.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        dailyLimit: dailyLimit || 1000.00,
        monthlyLimit: monthlyLimit || 10000.00,
        maxSingleTransaction: maxSingleTransaction || 500.00,
        paymentMethodLimit: paymentMethodLimit || 5,
        privacySettings: privacySettings ? JSON.stringify(privacySettings) : JSON.stringify({
          shareDataWithPartners: false,
          allowMarketingEmails: false,
          showTransactionHistory: true
        }),
        dataRetention: dataRetention || '2_years'
      }
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'settings_updated',
        details: JSON.stringify({
          updatedFields: Object.keys(updateData),
          timestamp: new Date().toISOString()
        })
      }
    });

    const settingsWithParsedJSON = {
      ...settings,
      privacySettings: JSON.parse(settings.privacySettings)
    };

    res.json({
      message: 'Settings updated successfully',
      settings: settingsWithParsedJSON
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

router.get('/limits', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const settings = await prisma.accountSetting.findUnique({
      where: { userId },
      select: {
        dailyLimit: true,
        monthlyLimit: true,
        maxSingleTransaction: true,
        paymentMethodLimit: true
      }
    });

    if (!settings) {
      return res.json({
        limits: {
          dailyLimit: 1000.00,
          monthlyLimit: 10000.00,
          maxSingleTransaction: 500.00,
          paymentMethodLimit: 5
        }
      });
    }

    res.json({ limits: settings });
  } catch (error) {
    console.error('Error fetching limits:', error);
    res.status(500).json({ error: 'Failed to fetch limits' });
  }
});

router.put('/limits', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { dailyLimit, monthlyLimit, maxSingleTransaction, paymentMethodLimit } = req.body;

    const errors: string[] = [];

    if (dailyLimit !== undefined && (typeof dailyLimit !== 'number' || dailyLimit <= 0 || dailyLimit > 100000)) {
      errors.push('Daily limit must be between $1 and $100,000');
    }

    if (monthlyLimit !== undefined && (typeof monthlyLimit !== 'number' || monthlyLimit <= 0 || monthlyLimit > 1000000)) {
      errors.push('Monthly limit must be between $1 and $1,000,000');
    }

    if (maxSingleTransaction !== undefined && (typeof maxSingleTransaction !== 'number' || maxSingleTransaction <= 0 || maxSingleTransaction > 50000)) {
      errors.push('Max single transaction must be between $1 and $50,000');
    }

    if (paymentMethodLimit !== undefined && (typeof paymentMethodLimit !== 'number' || paymentMethodLimit < 1 || paymentMethodLimit > 10)) {
      errors.push('Payment method limit must be between 1 and 10');
    }

    if (errors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors 
      });
    }

    const updateData: any = {};
    if (dailyLimit !== undefined) updateData.dailyLimit = dailyLimit;
    if (monthlyLimit !== undefined) updateData.monthlyLimit = monthlyLimit;
    if (maxSingleTransaction !== undefined) updateData.maxSingleTransaction = maxSingleTransaction;
    if (paymentMethodLimit !== undefined) updateData.paymentMethodLimit = paymentMethodLimit;

    const settings = await prisma.accountSetting.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        dailyLimit: dailyLimit || 1000.00,
        monthlyLimit: monthlyLimit || 10000.00,
        maxSingleTransaction: maxSingleTransaction || 500.00,
        paymentMethodLimit: paymentMethodLimit || 5,
        privacySettings: JSON.stringify({
          shareDataWithPartners: false,
          allowMarketingEmails: false,
          showTransactionHistory: true
        }),
        dataRetention: '2_years'
      },
      select: {
        dailyLimit: true,
        monthlyLimit: true,
        maxSingleTransaction: true,
        paymentMethodLimit: true
      }
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'limits_updated',
        details: JSON.stringify(updateData)
      }
    });

    res.json({
      message: 'Spending limits updated successfully',
      limits: settings
    });
  } catch (error) {
    console.error('Error updating limits:', error);
    res.status(500).json({ error: 'Failed to update limits' });
  }
});

export default router;