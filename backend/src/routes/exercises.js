const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Get all exercises
router.get('/', async (req, res) => {
  const { type } = req.query;
  
  try {
    const where = type ? { type } : {};
    const exercises = await prisma.exercises.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    res.json(exercises);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get exercise by id
router.get('/:id', async (req, res) => {
  try {
    const exercise = await prisma.exercises.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    
    if (!exercise) {
      return res.status(404).json({ error: 'Exercice non trouvé' });
    }
    
    res.json(exercise);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get random speaking words
router.get('/speaking/words', async (req, res) => {
  try {
    const words = await prisma.speaking_words.findMany();
    
    if (words.length < 2) {
      return res.json({ word1: null, word2: null });
    }
    
    // Get 2 random words
    const shuffled = words.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 2);
    
    res.json({
      word1: selected[0].word,
      word2: selected[1].word
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get themes for practice mode
router.get('/themes/all', async (req, res) => {
  try {
    const themes = await prisma.themes.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(themes);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
