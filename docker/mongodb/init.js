// Connexion à la base de données
db = db.getSiblingDB('chat_messages');

print('🚀 Initializing MongoDB for Chat Application...');

// =================================
// COLLECTION MESSAGES
// =================================

// Création de la collection messages avec validation
db.createCollection('messages', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['content', 'senderId', 'roomId', 'timestamp'],
      properties: {
        content: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 2000,
          description: 'Le contenu du message (1-2000 caractères)'
        },
        senderId: {
          bsonType: 'int',
          minimum: 1,
          description: 'ID de l\'utilisateur qui envoie le message'
        },
        senderUsername: {
          bsonType: 'string',
          description: 'Username de l\'expéditeur pour l\'affichage'
        },
        senderAvatar: {
          bsonType: 'string',
          description: 'URL de l\'avatar de l\'expéditeur'
        },
        roomId: {
          bsonType: 'string',
          description: 'ID de la room/conversation'
        },
        timestamp: {
          bsonType: 'date',
          description: 'Timestamp du message'
        },
        messageType: {
          bsonType: 'string',
          enum: ['text', 'image', 'file', 'system', 'emoji'],
          description: 'Type de message'
        },
        isEdited: {
          bsonType: 'bool',
          description: 'Si le message a été édité'
        },
        editedAt: {
          bsonType: 'date',
          description: 'Date de la dernière édition'
        },
        isDeleted: {
          bsonType: 'bool',
          description: 'Si le message a été supprimé (soft delete)'
        },
        deletedAt: {
          bsonType: 'date',
          description: 'Date de suppression'
        },
        readBy: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            required: ['userId', 'readAt'],
            properties: {
              userId: { bsonType: 'int' },
              readAt: { bsonType: 'date' }
            }
          },
          description: 'Liste des utilisateurs qui ont lu le message'
        },
        reactions: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            required: ['userId', 'emoji', 'createdAt'],
            properties: {
              userId: { bsonType: 'int' },
              emoji: { bsonType: 'string' },
              createdAt: { bsonType: 'date' }
            }
          },
          description: 'Réactions au message'
        }
      }
    }
  }
});

// =================================
// COLLECTION ROOMS/CONVERSATIONS
// =================================

db.createCollection('rooms', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'type', 'createdBy', 'createdAt'],
      properties: {
        name: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 100,
          description: 'Nom de la room (1-100 caractères)'
        },
        type: {
          bsonType: 'string',
          enum: ['public', 'private', 'direct'],
          description: 'Type de room'
        },
        description: {
          bsonType: 'string',
          maxLength: 500,
          description: 'Description de la room'
        },
        createdBy: {
          bsonType: 'int',
          minimum: 1,
          description: 'ID de l\'utilisateur créateur'
        },
        members: {
          bsonType: 'array',
          items: { 
            bsonType: 'object',
            required: ['userId', 'joinedAt'],
            properties: {
              userId: { bsonType: 'int' },
              role: { 
                bsonType: 'string',
                enum: ['owner', 'admin', 'moderator', 'member']
              },
              joinedAt: { bsonType: 'date' },
              leftAt: { bsonType: 'date' }
            }
          },
          description: 'Liste des membres avec leurs rôles'
        },
        isActive: {
          bsonType: 'bool',
          description: 'Si la room est active'
        },
        lastActivity: {
          bsonType: 'date',
          description: 'Dernière activité dans la room'
        },
        createdAt: {
          bsonType: 'date',
          description: 'Date de création'
        },
        updatedAt: {
          bsonType: 'date',
          description: 'Date de mise à jour'
        }
      }
    }
  }
});

// =================================
// COLLECTION ONLINE USERS
// =================================

db.createCollection('online_users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'socketId', 'lastSeen'],
      properties: {
        userId: {
          bsonType: 'int',
          minimum: 1,
          description: 'ID de l\'utilisateur'
        },
        socketId: {
          bsonType: 'string',
          description: 'ID de la socket WebSocket'
        },
        status: {
          bsonType: 'string',
          enum: ['online', 'away', 'busy', 'invisible'],
          description: 'Statut de l\'utilisateur'
        },
        lastSeen: {
          bsonType: 'date',
          description: 'Dernière activité'
        },
        currentRoom: {
          bsonType: 'string',
          description: 'Room actuelle de l\'utilisateur'
        }
      }
    }
  }
});

// =================================
// INDEX POUR PERFORMANCES
// =================================

print('📊 Creating indexes for performance...');

// Index pour les messages
db.messages.createIndex({ roomId: 1, timestamp: -1 });
db.messages.createIndex({ senderId: 1 });
db.messages.createIndex({ timestamp: -1 });
db.messages.createIndex({ roomId: 1, isDeleted: 1 });
db.messages.createIndex({ "readBy.userId": 1 });

// Index pour les rooms
db.rooms.createIndex({ type: 1 });
db.rooms.createIndex({ "members.userId": 1 });
db.rooms.createIndex({ createdBy: 1 });
db.rooms.createIndex({ isActive: 1 });
db.rooms.createIndex({ lastActivity: -1 });

// Index pour les utilisateurs en ligne
db.online_users.createIndex({ userId: 1 }, { unique: true });
db.online_users.createIndex({ socketId: 1 }, { unique: true });
db.online_users.createIndex({ status: 1 });
db.online_users.createIndex({ lastSeen: -1 });

// Index TTL pour nettoyer automatiquement les utilisateurs hors ligne
db.online_users.createIndex({ lastSeen: 1 }, { expireAfterSeconds: 300 });

print('✅ MongoDB initialized successfully for Chat Application!');