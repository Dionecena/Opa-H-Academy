const express = require('express');
const router = express.Router();
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const cloudinary = require('cloudinary').v2;

const prisma = new PrismaClient();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Use memory storage for Cloudinary upload
const upload = multer({
  storage: multer.memoryStorage(),
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

// Create audio submission (Cloudinary)
router.post('/audio', upload.single('audio'), async (req, res) => {
  const { username, context } = req.body;
  
  if (!username || !context || !req.file) {
    return res.status(400).json({ error: 'Champs manquants' });
  }

  const normalizedUsername = String(username).trim().toLowerCase();
  
  try {
    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video', // 'video' works for audio files too
          folder: 'opa-h-audio',
          format: 'webm'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    const submission = await prisma.submissions.create({
      data: {
        username: normalizedUsername,
        type: 'audio',
        context,
        content: result.secure_url // Cloudinary URL
      }
    });
    res.json(submission);
  } catch (error) {
    console.error('Cloudinary upload error:', error);
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
    
    // Delete from Cloudinary if audio
    if (submission.type === 'audio' && submission.content.includes('cloudinary')) {
      try {
        // Extract public_id from URL: https://res.cloudinary.com/.../opa-h-audio/xxx.webm
        const urlParts = submission.content.split('/');
        const fileName = urlParts[urlParts.length - 1]; // xxx.webm
        const publicId = `opa-h-audio/${fileName.replace('.webm', '')}`;
        
        await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
      } catch (cloudErr) {
        console.error('Cloudinary delete error:', cloudErr);
        // Continue anyway to delete from DB
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
