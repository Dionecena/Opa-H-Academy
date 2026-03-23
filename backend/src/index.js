const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

// Import routes
const userRoutes = require('./routes/users');
const exerciseRoutes = require('./routes/exercises');
const submissionRoutes = require('./routes/submissions');
const commentRoutes = require('./routes/comments');
const adminRoutes = require('./routes/admin');

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Create uploads directory if not exists
const uploadsDir = path.join(__dirname, '../uploads/audio');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

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

// Cron job: Delete submissions and comments older than 60 days
// Runs every day at 3:00 AM
cron.schedule('0 3 * * *', async () => {
  console.log('Running cleanup job...');
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  try {
    // Get audio submissions to delete files
    const oldAudioSubmissions = await prisma.submissions.findMany({
      where: {
        type: 'audio',
        createdAt: { lt: sixtyDaysAgo }
      }
    });

    // Delete audio files
    for (const submission of oldAudioSubmissions) {
      const filePath = path.join(__dirname, '..', submission.content);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted audio file: ${submission.content}`);
      }
    }

    // Delete old comments
    const deletedComments = await prisma.comments.deleteMany({
      where: {
        createdAt: { lt: sixtyDaysAgo }
      }
    });
    console.log(`Deleted ${deletedComments.count} comments`);

    // Delete old submissions
    const deletedSubmissions = await prisma.submissions.deleteMany({
      where: {
        createdAt: { lt: sixtyDaysAgo }
      }
    });
    console.log(`Deleted ${deletedSubmissions.count} submissions`);

    // Clean orphan audio files (files not in database)
    const allSubmissions = await prisma.submissions.findMany({
      where: { type: 'audio' }
    });
    const dbFiles = new Set(allSubmissions.map(s => path.basename(s.content)));
    
    const audioFiles = fs.readdirSync(uploadsDir);
    for (const file of audioFiles) {
      if (!dbFiles.has(file)) {
        fs.unlinkSync(path.join(uploadsDir, file));
        console.log(`Deleted orphan file: ${file}`);
      }
    }

  } catch (error) {
    console.error('Cleanup job error:', error);
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
