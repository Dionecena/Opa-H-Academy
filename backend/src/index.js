const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const cloudinary = require('cloudinary').v2;

const prisma = new PrismaClient();
const app = express();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Import routes
const userRoutes = require('./routes/users');
const exerciseRoutes = require('./routes/exercises');
const submissionRoutes = require('./routes/submissions');
const commentRoutes = require('./routes/comments');
const adminRoutes = require('./routes/admin');

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/admin', adminRoutes);

// Root route
app.get('/', (req, res) => {
  res.type('text').send(
    'OPA H ACADEMIE backend is running.\n' +
    'API: http://localhost:' + (process.env.PORT || 5000) + '/api/health\n' +
    'Frontend: http://localhost:3000\n'
  );
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Cron job: Delete data older than 90 days (3 months)
// Runs every day at 3:00 AM
cron.schedule('0 3 * * *', async () => {
  console.log('Running cleanup job...');
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);

  try {
    const oldSubmissions = await prisma.submissions.findMany({
      where: { createdAt: { lt: cutoff } },
      select: { id: true, type: true, content: true }
    });

    const oldSubmissionIds = oldSubmissions.map(s => s.id);

    // Delete audio files from Cloudinary
    const oldAudioSubmissions = oldSubmissions.filter(s => s.type === 'audio');
    for (const submission of oldAudioSubmissions) {
      if (submission.content && submission.content.includes('cloudinary')) {
        try {
          const urlParts = submission.content.split('/');
          const fileName = urlParts[urlParts.length - 1];
          const publicId = `opa-h-audio/${fileName.replace('.webm', '')}`;
          await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
          console.log(`Deleted Cloudinary audio: ${publicId}`);
        } catch (cloudErr) {
          console.error('Cloudinary delete error:', cloudErr);
        }
      }
    }

    // Delete comments (older than cutoff OR linked to old submissions)
    const deletedComments = await prisma.comments.deleteMany({
      where: {
        OR: [
          { createdAt: { lt: cutoff } },
          ...(oldSubmissionIds.length > 0
            ? [{ submissionId: { in: oldSubmissionIds } }]
            : [])
        ]
      }
    });
    console.log(`Deleted ${deletedComments.count} comments`);

    // Delete old submissions
    const deletedSubmissions = await prisma.submissions.deleteMany({
      where: oldSubmissionIds.length > 0
        ? { id: { in: oldSubmissionIds } }
        : { createdAt: { lt: cutoff } }
    });
    console.log(`Deleted ${deletedSubmissions.count} submissions`);

    // Delete exercises/themes older than cutoff (keep users + speaking_words)
    const deletedExercises = await prisma.exercises.deleteMany({
      where: { createdAt: { lt: cutoff } }
    });
    console.log(`Deleted ${deletedExercises.count} exercises`);

    const deletedThemes = await prisma.themes.deleteMany({
      where: { createdAt: { lt: cutoff } }
    });
    console.log(`Deleted ${deletedThemes.count} themes`);

  } catch (error) {
    console.error('Cleanup job error:', error);
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
