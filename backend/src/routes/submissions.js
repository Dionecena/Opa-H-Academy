const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const UPLOADS_DIR = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(__dirname, '../../uploads');

const AUDIO_DIR = path.join(UPLOADS_DIR, 'audio');
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

// Configure multer for audio uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, AUDIO_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}.webm`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// Get all submissions (collaborative view)
router.get('/', async (req, res) => {
  const { context, username } = req.query;
  
  try {
    const where = {};
    if (context) where.context = context;
    if (username) where.username = String(username).trim().toLowerCase();
    
    const submissions = await prisma.submissions.findMany({
      where,
      include: {
        _count: {
          select: { comments: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get single submission with comments
router.get('/:id', async (req, res) => {
  try {
    const submission = await prisma.submissions.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        comments: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });
    
    if (!submission) {
      return res.status(404).json({ error: 'Soumission non trouvée' });
    }
    
    res.json(submission);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Create text submission
router.post('/text', async (req, res) => {
  const { username, context, content } = req.body;
  
  if (!username || !context || !content) {
    return res.status(400).json({ error: 'Champs manquants' });
  }

  const normalizedUsername = String(username).trim().toLowerCase();
  
  try {
    const submission = await prisma.submissions.create({
      data: {
        username: normalizedUsername,
        type: 'text',
        context,
        content
      }
    });
    res.json(submission);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Create audio submission
router.post('/audio', upload.single('audio'), async (req, res) => {
  const { username, context } = req.body;
  
  if (!username || !context || !req.file) {
    return res.status(400).json({ error: 'Champs manquants' });
  }

  const normalizedUsername = String(username).trim().toLowerCase();
  
  try {
    const audioPath = `/uploads/audio/${req.file.filename}`;
    const submission = await prisma.submissions.create({
      data: {
        username: normalizedUsername,
        type: 'audio',
        context,
        content: audioPath
      }
    });
    res.json(submission);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Delete submission
router.delete('/:id', async (req, res) => {
  try {
    const submission = await prisma.submissions.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    
    if (!submission) {
      return res.status(404).json({ error: 'Soumission non trouvée' });
    }
    
    // Delete audio file if exists
    if (submission.type === 'audio') {
      const fileName = path.basename(submission.content || '');
      const filePath = path.join(AUDIO_DIR, fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    await prisma.submissions.delete({
      where: { id: parseInt(req.params.id) }
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
