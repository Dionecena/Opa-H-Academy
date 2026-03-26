const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const toInt = (v, fallback) => {
  const n = parseInt(String(v || ''), 10);
  return Number.isFinite(n) ? n : fallback;
};

// Get grammar exercises (public)
// Filters: theme, niveau, sous_theme, type
router.get('/', async (req, res) => {
  const { theme, niveau, sous_theme, type } = req.query;
  const limit = Math.min(Math.max(toInt(req.query.limit, 50), 1), 200);
  const offset = Math.max(toInt(req.query.offset, 0), 0);

  try {
    const where = {};
    if (theme) where.theme = String(theme);
    if (niveau) where.niveau = String(niveau);
    if (sous_theme) where.sousTheme = String(sous_theme);
    if (type) where.exType = String(type);

    const rows = await prisma.grammar_exercises.findMany({
      where,
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      skip: offset,
      take: limit,
      select: { data: true, uid: true, createdAt: true }
    });

    res.json(rows.map(r => r.data));
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get grammar exercise by uid (public)
router.get('/:uid', async (req, res) => {
  const uid = String(req.params.uid || '').trim();
  if (!uid) return res.status(400).json({ error: 'uid requis' });

  try {
    const row = await prisma.grammar_exercises.findUnique({
      where: { uid },
      select: { data: true }
    });

    if (!row) {
      return res.status(404).json({ error: 'Exercice non trouvé' });
    }

    res.json(row.data);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
