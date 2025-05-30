# Architecture du Système de Chat

## Vue d'ensemble

Cette application est un système de chat en temps réel construit avec une architecture moderne full-stack. Le système utilise une approche de base de données hybride pour optimiser les performances et la scalabilité.

## Stack Technologique

### Frontend
- **Framework**: React avec TypeScript
- **État**: Context API pour la gestion d'état globale
- **Temps réel**: Socket.io-client pour les WebSockets
- **UI**: Tailwind CSS + shadcn/ui components
- **Routing**: React Router
- **Build**: Vite

### Backend
- **Framework**: NestJS avec TypeScript
- **API**: REST + WebSocket (Socket.io)
- **Documentation**: Swagger/OpenAPI
- **Authentification**: JWT avec Passport.js
- **Validation**: class-validator + class-transformer

### Bases de données
- **PostgreSQL**: Pour les données relationnelles (utilisateurs)
- **MongoDB**: Pour les données non-relationnelles (messages, salles)

### Infrastructure
- **Conteneurisation**: Docker Compose
- **Monorepo**: Nx pour la gestion du workspace
- **Tests**: Jest pour les tests unitaires

## Architecture des Données

### Stratégie de Base de Données Hybride

Le système utilise deux bases de données pour optimiser les performances:

#### PostgreSQL
Utilisé pour les **données utilisateur** car:
- Relations complexes potentielles (amis, contacts, etc.)
- Intégrité référentielle forte requise
- Transactions ACID nécessaires pour l'authentification
- Recherches complexes sur les profils utilisateur
- Évolutivité verticale suffisante pour les données utilisateur

#### MongoDB
Utilisé pour les **messages et salles de chat** car:
- Volume élevé de messages nécessitant une scalabilité horizontale
- Structure de document flexible pour les messages enrichis
- Performance en écriture optimale pour le temps réel
- TTL natif pour la gestion des utilisateurs en ligne
- Agrégations efficaces pour l'historique des messages

### Modèles de Données

#### Entités PostgreSQL

```
┌─────────────────────────┐
│        UserEntity       │
├─────────────────────────┤
│ id: UUID                │
│ email: string (unique)  │
│ username: string        │
│ password: string (hash) │
│ firstName: string       │
│ lastName: string        │
│ isActive: boolean       │
│ isAdmin: boolean        │
│ createdAt: Date         │
│ updatedAt: Date         │
└─────────────────────────┘
```

#### Collections MongoDB

```
┌─────────────────────────┐     ┌─────────────────────────┐
│         Room            │     │        Message          │
├─────────────────────────┤     ├─────────────────────────┤
│ _id: ObjectId           │◄────│ roomId: ObjectId        │
│ name: string            │     │ _id: ObjectId           │
│ type: 'direct'          │     │ content: string         │
│ members: [{             │     │ messageType: string     │
│   userId: UUID          │     │ senderId: UUID          │
│   username: string      │     │ senderUsername: string  │
│   role: string          │     │ senderAvatar?: string   │
│   joinedAt: Date        │     │ isEdited: boolean       │
│ }]                      │     │ editedAt?: Date         │
│ createdBy: UUID         │     │ isDeleted: boolean      │
│ isActive: boolean       │     │ deletedAt?: Date        │
│ createdAt: Date         │     │ createdAt: Date         │
│ updatedAt: Date         │     │ updatedAt: Date         │
└─────────────────────────┘     └─────────────────────────┘

┌─────────────────────────┐
│      OnlineUser         │
├─────────────────────────┤
│ _id: ObjectId           │
│ userId: UUID            │
│ socketId: string        │
│ username: string        │
│ lastActivity: Date      │
│ createdAt: Date (TTL)   │
└─────────────────────────┘
```

### Relations entre les Modèles

1. **User ↔ Room**: Relation many-to-many via `members` array dans Room
2. **Room ↔ Message**: Relation one-to-many (une salle contient plusieurs messages)
3. **User ↔ Message**: Relation via `senderId` (référence l'UUID de PostgreSQL)
4. **User ↔ OnlineUser**: Relation temporaire pour tracking des utilisateurs connectés

## Architecture de l'Application

### Structure en Couches

```
┌─────────────────────────────────────────────────┐
│                   Frontend                      │
│  ┌──────────────────────────────────────────┐  │
│  │            React Components              │  │
│  ├──────────────────────────────────────────┤  │
│  │     Context (Auth, Chat, Socket)         │  │
│  ├──────────────────────────────────────────┤  │
│  │          API Client / Socket.io          │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                        │
                        │ HTTP/WS
                        ▼
┌─────────────────────────────────────────────────┐
│                   Backend                       │
│  ┌──────────────────────────────────────────┐  │
│  │           Controllers/Gateways           │  │
│  ├──────────────────────────────────────────┤  │
│  │              Services                    │  │
│  ├──────────────────────────────────────────┤  │
│  │      Guards/Interceptors/Pipes          │  │
│  ├──────────────────────────────────────────┤  │
│  │         Repositories/Schemas             │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                        │
           ┌────────────┴────────────┐
           ▼                         ▼
    ┌─────────────┐           ┌─────────────┐
    │ PostgreSQL  │           │   MongoDB   │
    └─────────────┘           └─────────────┘
```

### Modules du Backend

1. **AppModule**: Module racine, orchestrateur principal
2. **AuthModule**: Gestion de l'authentification JWT
3. **UsersModule**: CRUD et gestion des utilisateurs
4. **MessagesModule**: Chat temps réel et gestion des messages

### Flux d'Authentification

```
1. Register/Login (HTTP POST)
   └─> AuthController
       └─> AuthService
           └─> UsersRepository (PostgreSQL)
               └─> JWT Token Generation

2. Protected Routes
   └─> JwtAuthGuard
       └─> JwtStrategy
           └─> Validate Token
               └─> Allow/Deny Access

3. WebSocket Authentication
   └─> WsJwtGuard
       └─> Extract Token from Socket
           └─> Validate User
               └─> Attach User to Socket
```

### Flux de Messages en Temps Réel

```
1. Client sends message
   └─> Socket.emit('sendMessage')
       └─> MessagesGateway
           └─> Validate User & Room
               └─> Save to MongoDB
                   └─> Broadcast to room members
                       └─> Update UI in real-time

2. Room Management
   └─> HTTP API for create/join/leave
       └─> Update MongoDB
           └─> Notify via WebSocket
               └─> Update connected clients
```

## Patterns et Bonnes Pratiques

### Design Patterns Utilisés

1. **Repository Pattern**: Abstraction de l'accès aux données
2. **Dependency Injection**: Via le conteneur IoC de NestJS
3. **Guard Pattern**: Pour la sécurité et l'autorisation
4. **DTO Pattern**: Validation et transformation des données
5. **Decorator Pattern**: Métadonnées et configuration

### Sécurité

1. **Authentification**: JWT avec refresh tokens
2. **Autorisation**: Guards basés sur les rôles (admin/user)
3. **Validation**: DTOs avec class-validator
4. **Sanitisation**: Protection XSS sur les messages
5. **Rate Limiting**: Protection contre le spam (à implémenter)

### Performance

1. **Indexation DB**: Index sur les champs fréquemment recherchés
2. **Pagination**: Pour les listes de messages
3. **Cache**: Utilisateurs en ligne avec TTL MongoDB
4. **Connection Pooling**: Pour PostgreSQL et MongoDB
5. **Lazy Loading**: Chargement progressif des messages

## Évolution Future

### Fonctionnalités Planifiées

1. **Messages de groupe**: Extension du type de salle
5. **Présence en temps réel**: Indicateurs "en train d'écrire"


## Conventions de Code

### Nommage
- **Entités**: PascalCase avec suffixe `Entity`
- **DTOs**: PascalCase avec suffixe `Dto`
- **Interfaces**: PascalCase sans préfixe `I`
- **Services**: PascalCase avec suffixe `Service`
- **Modules**: PascalCase avec suffixe `Module`

### Structure des Fichiers
```
module/
├── dto/           # Data Transfer Objects
├── entities/      # Database entities
├── interfaces/    # TypeScript interfaces
├── guards/        # Security guards
├── module.ts      # Module definition
├── controller.ts  # HTTP endpoints
├── service.ts     # Business logic
└── gateway.ts     # WebSocket handlers
```