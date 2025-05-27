# 🚀 FullStack Chat Application

Application de messagerie instantanée complète construite avec **NestJS**, **React**, **PostgreSQL**, **MongoDB** dans un monorepo **NX**.

## 🏗️ Architecture

```
chat-fullstack/
├── apps/
│   ├── backend/          # API NestJS + WebSocket
│   └── frontend/         # Application React
├── libs/
│   ├── shared-types/     # Types TypeScript partagés
│   ├── shared-utils/     # Utilitaires communs
│   └── shared-constants/ # Constantes partagées
├── docker/               # Scripts d'initialisation DB
└── docker-compose.yml    # Infrastructure Docker
```

## 🛠️ Stack Technique

### Backend
- **NestJS** - Framework Node.js avec TypeScript
- **PostgreSQL** - Base de données utilisateurs
- **MongoDB** - Base de données messages
- **JWT** - Authentification
- **WebSocket** - Communication temps réel
- **bcrypt** - Hachage des mots de passe

### Frontend
- **React** avec TypeScript
- **React Router** - Navigation
- **Context API** - Gestion d'état
- **Socket.io Client** - WebSocket
- **CSS/SCSS** - Styling

### Outils
- **NX** - Monorepo et build system
- **Docker** - Conteneurisation
- **Jest** - Tests unitaires
- **ESLint** - Linting
- **Prettier** - Formatage

## 🚀 Démarrage Rapide

### Prérequis
- **Node.js** 18+ 
- **Docker** et **Docker Compose**
- **Yarn** (recommandé)
- **Make** (pour utiliser le Makefile)

### Installation

```bash
# 1. Clone le projet
git clone https://github.com/wyeo/chat-fullstack
cd chat-fullstack

# 2. Configuration initiale
make setup

# 3. Démarrage de l'infrastructure Docker
make start

# 4. Mode développement
make dev
```

### URLs de développement

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:4200 | Interface utilisateur React |
| **Backend API** | http://localhost:3333/api | API REST NestJS |
| **pgAdmin** | http://localhost:5050 | Interface PostgreSQL |
| **Mongo Express** | http://localhost:8081 | Interface MongoDB |

### Comptes par défaut

**pgAdmin :**
- Email: `admin@chat.local`
- Password: `password`

**Base de données :**
- PostgreSQL: `admin` / `password`
- MongoDB: `admin` / `password`

## 📋 Commandes Disponibles

### Makefile (recommandé)
```bash
make help              # Affiche l'aide
make setup             # Configuration initiale
make start             # Démarre l'infrastructure Docker
make stop              # Arrête tout
make clean             # Nettoie tout (containers, volumes)
make logs              # Affiche les logs Docker

make dev               # Mode dev complet (DB + Apps)
make dev-backend       # Backend + DB
make dev-frontend      # Frontend
make db-only           # Bases de données

make test              # Lance tous les tests
make test-backend      # Tests backend
make test-frontend     # Tests frontend

make build             # Build de production
make build-backend     # Build backend
make build-frontend    # Build frontend
```

### Scripts Yarn
```bash
# Développement
yarn dev            # Backend + Frontend
yarn dev:backend    # Backend
yarn dev:frontend   # Frontend

# Tests
yarn test           # Tous les tests
yarn test:backend   # Tests backend
yarn test:frontend  # Tests frontend
```

## 🗄️ Base de Données

### PostgreSQL - Utilisateurs
- **Port:** 5432
- **Base:** `chat_users`
- **Tables:** `users`

### MongoDB - Messages
- **Port:** 27017
- **Base:** `chat_messages`
- **Collections:** `messages`, `rooms`, `online_users`

### Connexion manuelle
```bash
# PostgreSQL
psql -h localhost -p 5432 -U admin -d chat_users

# MongoDB
mongosh "mongodb://admin:password@localhost:27017/chat_messages"
```

## 🧪 Tests

```bash
# Tous les tests
make test

# Tests spécifiques
make test-backend   # Tests backend
make test-frontend  # Tests frontend

# Tests avec couverture
make test-backend --coverage
```

## 🏗️ Build de Production

```bash
# Build complet
make build

# Build spécifique
make build-backend   # Build backend
make build-frontend  # Build frontend
```

## 🔧 Configuration

### Variables d'environnement (.env)

Copiez `.env.example` vers `.env` et adaptez :
```bash
cp .env.example .env
```

```bash
# Application
NODE_ENV=development
PORT=3333

# Bases de données
DATABASE_URL=postgresql://admin:password@localhost:5432/chat_users
MONGODB_URL=mongodb://admin:password@localhost:27017/chat_messages

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRATION=24h

# WebSocket
WEBSOCKET_PORT=3334
CORS_ORIGIN=http://localhost:4200
```

---

Made with ❤️ for Kanbios