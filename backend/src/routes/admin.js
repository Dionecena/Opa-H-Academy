const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');

const prisma = new PrismaClient();

const RP_ID = process.env.WEBAUTHN_RP_ID || '';
const RP_NAME = process.env.WEBAUTHN_RP_NAME || 'OPA H ACADEMIE';
const ORIGIN = process.env.WEBAUTHN_ORIGIN || '';
const ADMIN_SESSION_TTL_MINUTES = parseInt(process.env.ADMIN_SESSION_TTL_MINUTES || '30', 10);

// In-memory state (dev/local). If the server restarts between /options and /verify, WebAuthn will fail.
// Structure: username -> { challenge, origin, rpID }
const webauthnChallenges = new Map();

const getRequestOrigin = (req) => {
  return String(req.headers.origin || '').trim();
};

const getExpectedOriginAndRPID = (req) => {
  // Prefer explicit env values when provided
  if (ORIGIN && RP_ID) {
    return { expectedOrigin: ORIGIN, expectedRPID: RP_ID };
  }

  // Dev fallback: derive from request origin, but restrict to local origins
  const origin = getRequestOrigin(req);
  if (!origin) {
    return { expectedOrigin: ORIGIN || 'http://localhost:3000', expectedRPID: RP_ID || 'localhost' };
  }

  try {
    const u = new URL(origin);
    const host = u.hostname;
    const allowedHosts = new Set(['localhost', '127.0.0.1']);
    if (!allowedHosts.has(host)) {
      return { expectedOrigin: ORIGIN || 'http://localhost:3000', expectedRPID: RP_ID || 'localhost' };
    }
    return { expectedOrigin: origin, expectedRPID: host };
  } catch {
    return { expectedOrigin: ORIGIN || 'http://localhost:3000', expectedRPID: RP_ID || 'localhost' };
  }
};

const getBearerToken = (req) => {
  const header = String(req.headers.authorization || '').trim();
  if (!header) return '';
  const m = header.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : '';
};

// Middleware to check admin role from x-username
const checkAdminUser = async (req, res, next) => {
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

    req.adminUsername = username;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Middleware to require an active admin session token (Passkey unlock)
const checkAdminUnlocked = async (req, res, next) => {
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Admin verrouillé' });
  }

  try {
    const session = await prisma.admin_sessions.findUnique({
      where: { token }
    });

    if (!session || new Date(session.expiresAt).getTime() <= Date.now()) {
      return res.status(401).json({ error: 'Session admin expirée' });
    }

    if (req.adminUsername && session.username !== req.adminUsername) {
      return res.status(403).json({ error: 'Session admin invalide' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const requireAdmin = [checkAdminUser, checkAdminUnlocked];

// WebAuthn: registration options
router.post('/webauthn/register/options', checkAdminUser, async (req, res) => {
  try {
    const username = req.adminUsername;
    const platformOnly = Boolean(req.body?.platformOnly);

    const { expectedOrigin, expectedRPID } = getExpectedOriginAndRPID(req);

    const creds = await prisma.admin_webauthn_credentials.findMany({
      where: { username }
    });

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: expectedRPID,
      userID: username,
      userName: username,
      timeout: 60000,
      attestationType: 'none',
      excludeCredentials: creds.map(c => ({
        id: Buffer.from(c.credentialId, 'base64url'),
        type: 'public-key',
      })),
      authenticatorSelection: {
        ...(platformOnly ? { authenticatorAttachment: 'platform', residentKey: 'required' } : { residentKey: 'preferred' }),
        userVerification: 'required',
      },
    });

    webauthnChallenges.set(username, {
      challenge: options.challenge,
      origin: expectedOrigin,
      rpID: expectedRPID,
    });
    res.json(options);
  } catch (error) {
    console.error('register/options error', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// WebAuthn: registration verify
router.post('/webauthn/register/verify', checkAdminUser, async (req, res) => {
  try {
    const username = req.adminUsername;
    const state = webauthnChallenges.get(username);
    const expectedChallenge = state?.challenge;

    if (!expectedChallenge) {
      return res.status(400).json({ error: 'Challenge introuvable' });
    }

    const verification = await verifyRegistrationResponse({
      response: req.body,
      expectedChallenge,
      expectedOrigin: state?.origin || getExpectedOriginAndRPID(req).expectedOrigin,
      expectedRPID: state?.rpID || getExpectedOriginAndRPID(req).expectedRPID,
    });

    const { verified, registrationInfo } = verification;

    if (!verified || !registrationInfo) {
      return res.status(400).json({ error: 'Enregistrement refusé' });
    }

    // @simplewebauthn/server v9 structure
    const { credentialID, credentialPublicKey, counter } = registrationInfo;

    const credentialIdBase64 = Buffer.from(credentialID).toString('base64url');
    const publicKeyBase64 = Buffer.from(credentialPublicKey).toString('base64url');

    await prisma.admin_webauthn_credentials.upsert({
      where: { credentialId: credentialIdBase64 },
      update: {
        publicKey: publicKeyBase64,
        counter: counter ?? 0,
      },
      create: {
        username,
        credentialId: credentialIdBase64,
        publicKey: publicKeyBase64,
        counter: counter ?? 0,
      }
    });

    webauthnChallenges.delete(username);
    res.json({ verified: true });
  } catch (error) {
    console.error('register/verify error', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// WebAuthn: auth options
router.post('/webauthn/auth/options', checkAdminUser, async (req, res) => {
  try {
    const username = req.adminUsername;

    const { expectedOrigin, expectedRPID } = getExpectedOriginAndRPID(req);

    const creds = await prisma.admin_webauthn_credentials.findMany({
      where: { username }
    });

    if (creds.length === 0) {
      return res.status(400).json({ error: 'Aucune passkey enregistrée' });
    }

    const options = await generateAuthenticationOptions({
      timeout: 60000,
      rpID: expectedRPID,
      allowCredentials: creds.map(c => ({
        id: Buffer.from(c.credentialId, 'base64url'),
        type: 'public-key',
      })),
      userVerification: 'required',
    });

    webauthnChallenges.set(username, {
      challenge: options.challenge,
      origin: expectedOrigin,
      rpID: expectedRPID,
    });
    res.json(options);
  } catch (error) {
    console.error('auth/options error', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// WebAuthn: auth verify -> issue admin session token
router.post('/webauthn/auth/verify', checkAdminUser, async (req, res) => {
  try {
    const username = req.adminUsername;
    const state = webauthnChallenges.get(username);
    const expectedChallenge = state?.challenge;

    if (!expectedChallenge) {
      return res.status(400).json({ error: 'Challenge introuvable' });
    }

    // req.body.id is base64url encoded credential ID from the browser
    const credentialId = String(req.body?.id || '');
    console.log('Auth verify - credentialId from browser:', credentialId);
    
    const stored = await prisma.admin_webauthn_credentials.findUnique({
      where: { credentialId }
    });

    console.log('Auth verify - stored credential:', stored ? { id: stored.credentialId, counter: stored.counter } : null);

    if (!stored || stored.username !== username) {
      return res.status(400).json({ error: 'Credential inconnu' });
    }

    const verification = await verifyAuthenticationResponse({
      response: req.body,
      expectedChallenge,
      expectedOrigin: state?.origin || getExpectedOriginAndRPID(req).expectedOrigin,
      expectedRPID: state?.rpID || getExpectedOriginAndRPID(req).expectedRPID,
      authenticator: {
        credentialID: Buffer.from(stored.credentialId, 'base64url'),
        credentialPublicKey: Buffer.from(stored.publicKey, 'base64url'),
        counter: stored.counter ?? 0,
        transports: ['internal'],
      },
    });

    const { verified, authenticationInfo } = verification;

    if (!verified || !authenticationInfo) {
      return res.status(400).json({ error: 'Authentification refusée' });
    }

    await prisma.admin_webauthn_credentials.update({
      where: { credentialId: stored.credentialId },
      data: { counter: authenticationInfo.newCounter }
    });

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + ADMIN_SESSION_TTL_MINUTES * 60 * 1000);

    await prisma.admin_sessions.create({
      data: { username, token, expiresAt }
    });

    webauthnChallenges.delete(username);
    res.json({ token, expiresAt: expiresAt.toISOString() });
  } catch (error) {
    console.error('auth/verify error', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get admin stats
router.get('/stats', requireAdmin, async (req, res) => {
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
router.post('/exercises', requireAdmin, async (req, res) => {
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
router.put('/exercises/:id', requireAdmin, async (req, res) => {
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
router.delete('/exercises/:id', requireAdmin, async (req, res) => {
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
router.post('/words', requireAdmin, async (req, res) => {
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
router.get('/words', requireAdmin, async (req, res) => {
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
router.delete('/words/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.speaking_words.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Get all themes
router.get('/themes', requireAdmin, async (req, res) => {
  try {
    const themes = await prisma.themes.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(themes);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Add theme
router.post('/themes', requireAdmin, async (req, res) => {
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
router.delete('/themes/:id', requireAdmin, async (req, res) => {
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
router.put('/users/:username/role', requireAdmin, async (req, res) => {
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

// Change admin username (transfer admin rights)
router.put('/transfer-admin', requireAdmin, async (req, res) => {
  const { newUsername } = req.body;
  const currentAdmin = String(req.headers['x-username'] || '').trim().toLowerCase();
  
  if (!newUsername || newUsername.trim().length < 2) {
    return res.status(400).json({ error: 'Nouveau pseudo invalide (min 2 caractères)' });
  }
  
  const normalizedNew = newUsername.trim().toLowerCase();
  
  if (normalizedNew === currentAdmin) {
    return res.status(400).json({ error: 'Le nouveau pseudo doit être différent' });
  }
  
  try {
    // Check if new username already exists
    const existingUser = await prisma.users.findUnique({
      where: { username: normalizedNew }
    });
    
    if (existingUser) {
      // Transfer admin role to existing user
      await prisma.$transaction([
        prisma.users.update({
          where: { username: currentAdmin },
          data: { role: 'user' }
        }),
        prisma.users.update({
          where: { username: normalizedNew },
          data: { role: 'admin' }
        })
      ]);
    } else {
      // Create new admin user and demote current
      await prisma.$transaction([
        prisma.users.update({
          where: { username: currentAdmin },
          data: { role: 'user' }
        }),
        prisma.users.create({
          data: { username: normalizedNew, role: 'admin' }
        })
      ]);
    }
    
    res.json({ success: true, newAdmin: normalizedNew });
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
