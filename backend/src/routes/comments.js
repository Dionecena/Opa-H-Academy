const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Get comments for a submission
router.get('/submission/:submissionId', async (req, res) => {
  try {
    const comments = await prisma.comments.findMany({
      where: { submissionId: parseInt(req.params.submissionId) },
      orderBy: { createdAt: 'asc' }
    });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Create comment
router.post('/', async (req, res) => {
  const { submissionId, username, content } = req.body;
  
  if (!submissionId || !username || !content) {
    return res.status(400).json({ error: 'Champs manquants' });
  }

  const normalizedUsername = String(username).trim().toLowerCase();
  
  try {
    const comment = await prisma.comments.create({
      data: {
        submissionId: parseInt(submissionId),
        username: normalizedUsername,
        content
      }
    });
    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Delete comment
router.delete('/:id', async (req, res) => {
  try {
    await prisma.comments.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
