import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true
      }
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, email, passwordHash, phone } = req.body;
    
    if (!name || !email || !passwordHash) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        phone
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true
      }
    });

    res.status(201).json(user);
  } catch (error: any) {
  if (error.code === 'P2002') {
    return res.status(400).json({ error: 'Email already exists' });
  }
  res.status(500).json({ error: 'Failed to create user' });
}
});

// GET /api/users/:id - Get user by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;