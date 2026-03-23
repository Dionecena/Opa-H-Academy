const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Get or create user by username
router.post('/login', async (req, res) => {
  const { username } = req.body;
  
  if (!username || username.trim().length < 2) {
    return res.status(400).json({ error: 'Username invalide (min 2 caractères)' });
  }

  const normalizedUsername = username.trim().toLowerCase();

  try {
    let user = await prisma.users.findUnique({
      where: { username: normalizedUsername }
    });

    if (!user) {
      user = await prisma.users.create({
        data: { username: normalizedUsername }
      });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get user by username
router.get('/:username', async (req, res) => {
  try {
    const normalizedUsername = String(req.params.username || '').trim().toLowerCase();
    const user = await prisma.users.findUnique({
      where: { username: normalizedUsername }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get all users (for admin)
router.get('/', async (req, res) => {
  try {
    const users = await prisma.users.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
