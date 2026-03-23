# OPA H ACADEMIE

Plateforme d'apprentissage de l'allemand (niveau A1, type examen) avec fonctionnalités collaboratives.

## 🚀 Stack Technique

### Backend
- **Node.js** avec **Express.js**
- **PostgreSQL** comme base de données
- **Prisma** comme ORM
- **node-cron** pour la suppression automatique

### Frontend
- **React 18** (hooks + composants fonctionnels)
- **React Router** pour la navigation
- **Framer Motion** pour les animations
- **Lucide React** pour les icônes

## 📁 Structure du Projet

```
siteUncleH/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma      # Schéma de la base de données
│   ├── src/
│   │   ├── index.js           # Point d'entrée + cron jobs
│   │   └── routes/
│   │       ├── users.js       # Authentification
│   │       ├── exercises.js   # Exercices + thèmes
│   │       ├── submissions.js # Soumissions (texte/audio)
│   │       ├── comments.js    # Commentaires
│   │       └── admin.js       # Panel admin
│   ├── uploads/audio/         # Fichiers audio
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── UI.jsx           # Composants UI réutilisables
│   │   │   ├── AudioRecorder.jsx # Enregistrement audio
│   │   │   └── SubmissionCard.jsx # Carte de soumission
│   │   ├── pages/
│   │   │   ├── Home.jsx         # Page d'accueil
│   │   │   ├── Dashboard.jsx    # Tableau de bord
│   │   │   ├── ExamMode.jsx     # Mode Examen
│   │   │   ├── PracticeMode.jsx # Mode Exercices
│   │   │   ├── Collaborative.jsx # Vue collaborative
│   │   │   └── AdminPanel.jsx   # Panel admin
│   │   ├── config/
│   │   │   └── api.js           # Configuration API
│   │   ├── App.js
│   │   └── index.css
│   └── package.json
│
└── README.md
```

## 🛠️ Installation

### Prérequis
- Node.js 18+
- PostgreSQL

### 1. Configuration de la base de données

```bash
# Créer la base de données PostgreSQL
createdb opa_academie

# Ou avec psql
psql -U postgres -c "CREATE DATABASE opa_academie;"
```

### 2. Backend

```bash
cd backend

# Installer les dépendances
npm install

# Copier le fichier .env.example en .env
cp .env.example .env

# Modifier .env avec vos identifiants PostgreSQL
# DATABASE_URL="postgresql://user:password@localhost:5432/opa_academie?schema=public"

# Générer le client Prisma
npm run db:generate

# Pousser le schéma vers la base de données
npm run db:push

# Démarrer le serveur
npm run dev
```

### 3. Frontend

```bash
cd frontend

# Installer les dépendances
npm install

# Démarrer l'application
npm start
```

## 📱 Fonctionnalités

### Mode Examen (4 sections)

1. **Hören (Écoute)**
   - Vidéo YouTube intégrée
   - Questions QCM et vrai/faux
   - Score automatique

2. **Lesen (Lecture)**
   - Textes avec questions
   - QCM

3. **Schreiben (Écriture)**
   - Teil 1: Formulaire
   - Teil 2: Texte libre (~30 mots)

4. **Sprechen (Oral)**
   - Teil 1: Présentation (audio)
   - Teil 2: Question avec 2 mots aléatoires
   - Teil 3: Demande avec 2 mots aléatoires
   - Enregistrement audio max 60 secondes

### Mode Exercices
- Thèmes créés par l'admin
- Écriture de textes courts
- Soumissions sauvegardées

### Système Collaboratif
- Toutes les réponses visibles
- Commentaires sur chaque soumission
- Interface mobile-first

### Panel Admin
- Ajout de vidéos YouTube
- Gestion des mots pour Sprechen
- Gestion des thèmes d'exercices
- Statistiques

## 🔧 API Endpoints

### Users
- `POST /api/users/login` - Connexion/création utilisateur
- `GET /api/users/:username` - Infos utilisateur

### Exercises
- `GET /api/exercises` - Liste des exercices
- `GET /api/exercises/:id` - Détails exercice
- `GET /api/exercises/speaking/words` - Mots aléatoires
- `GET /api/exercises/themes/all` - Thèmes

### Submissions
- `GET /api/submissions` - Liste soumissions
- `GET /api/submissions/:id` - Détails soumission
- `POST /api/submissions/text` - Créer soumission texte
- `POST /api/submissions/audio` - Créer soumission audio

### Comments
- `GET /api/comments/submission/:id` - Commentaires
- `POST /api/comments` - Ajouter commentaire

### Admin
- `GET /api/admin/stats` - Statistiques
- `POST /api/admin/exercises` - Ajouter exercice
- `POST /api/admin/words` - Ajouter mot
- `POST /api/admin/themes` - Ajouter thème

## ⏰ Suppression Automatique

Le système supprime automatiquement :
- Les soumissions de plus de 60 jours
- Les commentaires de plus de 60 jours
- Les fichiers audio associés
- Les fichiers orphelins

Exécution quotidienne à 3h du matin via node-cron.

## 👤 Authentification

- Pas de mot de passe
- Username uniquement
- Stockage localStorage
- Reconnexion automatique

## 🎨 Design

- **Mobile-first** (priorité absolue)
- Interface responsive
- Mode sombre
- Animations fluides
- UX épurée

## 🔐 Premier Admin

Pour définir le premier admin, modifiez directement en base :

```sql
UPDATE users SET role = 'admin' WHERE username = 'votre_username';
```

Ou via Prisma Studio :

```bash
cd backend
npm run db:studio
```

## 📝 Licence

MIT - OPA H ACADEMIE 2024
