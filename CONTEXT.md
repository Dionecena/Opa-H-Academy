# Opa-H-Academy - Contexte Projet

## 📋 Vue d'ensemble

**Opa-H-Academy** est une application web d'apprentissage de l'allemand (grammaire, exercices, examens). Architecture fullstack JavaScript avec React (frontend) et Node.js/Express (backend), base de données SQLite via Prisma ORM.

---

## 🛠 Stack Technique

### Frontend
- **React 18** + Vite
- **Tailwind CSS** pour le styling
- **Framer Motion** pour les animations
- **React Router** pour la navigation
- **Lucide React** pour les icônes

### Backend
- **Node.js** + Express
- **Prisma ORM** avec SQLite
- **JWT** pour l'authentification
- **bcryptjs** pour le hash des mots de passe

### URLs
- Frontend dev: `http://localhost:3000` (ou 3001 si conflit)
- Backend API: `http://localhost:5000/api`

---

## 📁 Structure du Projet

```
siteUncleH/
├── frontend/
│   ├── src/
│   │   ├── pages/           # Pages principales
│   │   │   ├── Dashboard.jsx
│   │   │   ├── GrammarExercises.jsx
│   │   │   ├── ExamMode.jsx
│   │   │   ├── PracticeMode.jsx
│   │   │   ├── Collaborative.jsx
│   │   │   └── AdminPanel.jsx
│   │   ├── components/
│   │   │   └── UI.jsx       # Composants UI réutilisables (Header, Card, Button...)
│   │   ├── config/
│   │   │   └── api.js       # Configuration API et fonctions fetch
│   │   └── index.css        # Styles globaux + variables CSS
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── routes/          # Routes API
│   │   │   ├── auth.js
│   │   │   ├── grammarExercises.js
│   │   │   └── submissions.js
│   │   ├── scripts/
│   │   │   └── importGrammar.js  # Import des JSON d'exercices
│   │   └── middleware/
│   ├── prisma/
│   │   └── schema.prisma    # Schéma de la base de données
│   └── package.json
├── grammar_part*.json      # Fichiers d'exercices de grammaire (14 fichiers)
└── CONTEXT.md              # Ce fichier
```

---

## 🗄️ Schéma de Base de Données

### Modèles Principaux

```prisma
model User {
  id        String   @id @default(uuid())
  username  String   @unique
  email     String   @unique
  password  String
  role      String   @default("student")
  createdAt DateTime @default(now())
}

model GrammarExercise {
  id          String   @id
  theme       String
  sousTheme   String
  niveau      String   // A1, A2, B1, B2
  type        String   // ordre, completer, associer, choix
  consigne    String
  questions   Json     // Array de {question, options, reponse}
  difficulty  String   // facile, moyen, difficile
  score       Int
  createdAt   DateTime @default(now())
}

model Submission {
  id          String   @id @default(uuid())
  userId      String
  exerciseId  String
  answers     Json
  score       Int
  createdAt   DateTime @default(now())
}
```

---

## 🎯 Fonctionnalités Implémentées

### 1. Authentification
- Inscription / Connexion avec JWT
- Rôles: `student`, `teacher`, `admin`
- Middleware d'authentification sur les routes protégées

### 2. Exercices de Grammaire (`GrammarExercises.jsx`)
- **Filtres dynamiques** par thème, niveau, sous-thème
- **Options de filtres désactivées** (pas supprimées) si incompatibles avec la sélection actuelle
- **Pagination** pour charger tous les exercices (limit/offset)
- **Types d'exercices**:
  - `choix` / `completer`: Sélection parmi des options
  - `ordre`: Texte libre (textarea) pour phrases à construire
- **État des réponses** par question (`selectedAnswers[index]`)
- **Animation** Framer Motion pour les transitions

### 3. Modes d'Apprentissage
- **Dashboard**: Vue d'ensemble avec statistiques
- **ExamMode**: Mode examen avec timer
- **PracticeMode**: Pratique libre avec onglets
- **Collaborative**: Soumissions partagées entre utilisateurs
- **AdminPanel**: Gestion des utilisateurs et exercices (admin uniquement)

### 4. UI/UX Mobile-First
- **Header fixe** avec safe-area-inset pour les appareils à encoche
- **Padding-top (pt-16)** sur toutes les pages pour éviter le contenu collé sous le header
- **Tap highlight désactivé** pour une expérience native
- **Min-height 44px** pour les zones tactiles (boutons, selects)

---

## 🐛 Bugs Corrigés (Session Récente)

### 1. Réponses sélectionnées globales au lieu de par question
- **Problème**: Sélectionner une réponse cochait toutes les questions avec la même option
- **Solution**: État `selectedAnswers` objet avec index de question comme clé

### 2. Sous-thèmes A2 incomplets
- **Problème**: Seulement 1 sous-thème A2 affiché au lieu de tous
- **Solution**: Pagination côté frontend pour charger tous les exercices pour les métadonnées de filtres

### 3. Contenu collé sous le Header fixe
- **Problème**: Première section de chaque page cachée sous le header
- **Solution**: Ajout `pt-16` sur `<main>` de toutes les pages

### 4. Filtres incompatibles supprimés
- **Problème**: Options de filtres disparaissaient si incompatibles
- **Solution**: Options `disabled` (grisées) mais toujours visibles

### 5. Questions d'exercices "ordre" imprécises
- **Problème**: Exercices demandant d'utiliser un verbe sans préciser lequel
- **Solution**: Ajout du verbe attendu + exemple dans chaque question

---

## 📝 Exercices de Grammaire

### Structure JSON
```json
{
  "id": "verb-dat-05",
  "theme": "Verben mit Nominativ und Dativ",
  "sous_theme": "Verben mit Dativ - Kontext",
  "niveau": "A2",
  "type": "ordre",
  "consigne": "Schreiben Sie Sätze mit den Verben...",
  "questions": [
    {
      "question": "Morgen Abend habe ich keine Zeit.\n→ Verb: passen\n→ Beispiel: Das Kleid passt mir gut.",
      "options": [],
      "reponse": "Morgen Abend passt es mir nicht."
    }
  ],
  "difficulty": "difficile",
  "score": 1
}
```

### Types d'Exercices
- `ordre`: Construire des phrases (texte libre)
- `completer`: Compléter avec des options
- `choix`: QCM
- `associer`: Associer des éléments

### Niveaux
- A1 (Débutant)
- A2 (Élémentaire)
- B1 (Intermédiaire)
- B2 (Avancé)

---

## 🚀 Commandes Utiles

```bash
# Démarrer le backend
cd backend && npm run dev

# Démarrer le frontend
cd frontend && npm run dev

# Importer les exercices en base
cd backend && node src/scripts/importGrammar.js

# Build production frontend
cd frontend && npm run build
```

---

## 🔧 Configuration

### Backend (.env)
```
PORT=5000
JWT_SECRET=your-secret-key
DATABASE_URL="file:./dev.db"
```

### Frontend (api.js)
```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

---

## 📱 Points d'Attention Mobile

1. **Safe Area Insets**: Variables CSS pour les appareils à encoche
2. **Header Fixe**: Toujours visible, height 64px
3. **Zones Tactiles**: Min 44px de hauteur
4. **Scroll**: `overscroll-behavior: none` pour éviter le bounce
5. **Tap Highlight**: Désactivé pour un rendu natif

---

## 🎨 Variables CSS (index.css)

```css
:root {
  --primary: #6366f1;
  --primary-light: #818cf8;
  --primary-dark: #4f46e5;
  --glass-bg: rgba(255, 255, 255, 0.8);
  --glass-border: rgba(255, 255, 255, 0.3);
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
}
```

---

## 📊 État Actuel

- ✅ Frontend fonctionnel sur localhost:3000
- ✅ Backend API sur localhost:5000
- ✅ 447 exercices importés en base
- ✅ UI mobile-first responsive
- ✅ Authentification JWT opérationnelle
- ✅ Filtres dynamiques avec options désactivées
- ✅ Questions d'exercices clarifiées avec exemples

---

## 🔜 Améliorations Futures Suggérées

1. **Système de progression**: Tracker les exercices complétés par utilisateur
2. **Mode hors-ligne**: Service Worker pour PWA
3. **Audio**: Prononciation des phrases en allemand
4. **Gamification**: Badges, streaks, classements
5. **Feedback**: Explications après chaque réponse (correcte/incorrecte)
6. **Export PDF**: Générer des fiches d'exercices

---

*Document mis à jour: Mars 2026*
