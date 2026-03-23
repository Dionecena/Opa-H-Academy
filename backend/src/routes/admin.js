const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Middleware to check admin role
const checkAdmin = async (req, res, next) => {
  const username = String(req.headers['x-username'] || '').trim().toLowerCase();
  
  if (!username) {
    return res.status(401).json({ error: 'Non autorisé' });
  }
  
  try {
    const user = await prisma.users.findUnique({
      where: { username }
    });
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Get admin stats
router.get('/stats', checkAdmin, async (req, res) => {
  try {
    const usersCount = await prisma.users.count();
    const submissionsCount = await prisma.submissions.count();
    const commentsCount = await prisma.comments.count();
    const exercisesCount = await prisma.exercises.count();
    const wordsCount = await prisma.speaking_words.count();
    const themesCount = await prisma.themes.count();
    
    res.json({
      users: usersCount,
      submissions: submissionsCount,
      comments: commentsCount,
      exercises: exercisesCount,
      words: wordsCount,
      themes: themesCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Add YouTube video (exam exercise)
router.post('/exercises', checkAdmin, async (req, res) => {
  const { title, type, videoUrl, questions, content } = req.body;
  
  if (!title || !type) {
    return res.status(400).json({ error: 'Titre et type requis' });
  }
  
  // Convert YouTube URL to embed URL
  let embedUrl = videoUrl;
  if (videoUrl) {
    const youtubeMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (youtubeMatch) {
      embedUrl = `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
  }
  
  try {
    const exercise = await prisma.exercises.create({
      data: {
        title,
        type,
        videoUrl: embedUrl,
        questions,
        content
      }
    });
    res.json(exercise);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Update exercise
router.put('/exercises/:id', checkAdmin, async (req, res) => {
  const { title, videoUrl, questions, content } = req.body;
  
  try {
    let embedUrl = videoUrl;
    if (videoUrl) {
      const youtubeMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
      if (youtubeMatch) {
        embedUrl = `https://www.youtube.com/embed/${youtubeMatch[1]}`;
      }
    }
    
    const exercise = await prisma.exercises.update({
      where: { id: parseInt(req.params.id) },
      data: {
        title,
        videoUrl: embedUrl,
        questions,
        content
      }
    });
    res.json(exercise);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Delete exercise
router.delete('/exercises/:id', checkAdmin, async (req, res) => {
  try {
    await prisma.exercises.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Add speaking word
router.post('/words', checkAdmin, async (req, res) => {
  const { word } = req.body;
  
  if (!word || word.trim().length === 0) {
    return res.status(400).json({ error: 'Mot requis' });
  }
  
  try {
    const speakingWord = await prisma.speaking_words.create({
      data: { word: word.trim() }
    });
    res.json(speakingWord);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get all speaking words
router.get('/words', checkAdmin, async (req, res) => {
  try {
    const words = await prisma.speaking_words.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(words);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Delete speaking word
router.delete('/words/:id', checkAdmin, async (req, res) => {
  try {
    await prisma.speaking_words.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Add theme
router.post('/themes', checkAdmin, async (req, res) => {
  const { title } = req.body;
  
  if (!title || title.trim().length === 0) {
    return res.status(400).json({ error: 'Titre requis' });
  }
  
  try {
    const theme = await prisma.themes.create({
      data: { title: title.trim() }
    });
    res.json(theme);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Delete theme
router.delete('/themes/:id', checkAdmin, async (req, res) => {
  try {
    await prisma.themes.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Set user role
router.put('/users/:username/role', checkAdmin, async (req, res) => {
  const { role } = req.body;
  
  if (!role || !['user', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Rôle invalide' });
  }
  
  try {
    const user = await prisma.users.update({
      where: { username: req.params.username },
      data: { role }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
