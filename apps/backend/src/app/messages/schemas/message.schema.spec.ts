import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Connection, Model } from 'mongoose';

import { Message, MessageSchema, MessageType } from './message.schema';

interface MessageWithTimestamps extends Message {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

interface IndexInfo {
  key: Record<string, number>;
  name: string;
  v?: number;
}

describe('MessageSchema', () => {
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;
  let messageModel: Model<Message>;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    mongoConnection = mongoose.createConnection(uri);
    messageModel = mongoConnection.model('Message', MessageSchema);
    
    await messageModel.createIndexes();
  });

  afterAll(async () => {
    await mongoConnection.close();
    await mongod.stop();
  });

  afterEach(async () => {
    await messageModel.deleteMany({});
  });

  describe('Document Creation', () => {
    it('should create a message with all required fields', async () => {
      const messageData = {
        content: 'Hello, world!',
        senderId: 'user123',
        senderUsername: 'testuser',
        roomId: 'room123',
        timestamp: new Date(),
      };

      const message = await messageModel.create(messageData);

      expect(message.content).toBe(messageData.content);
      expect(message.senderId).toBe(messageData.senderId);
      expect(message.senderUsername).toBe(messageData.senderUsername);
      expect(message.roomId).toBe(messageData.roomId);
      expect(message.timestamp).toEqual(messageData.timestamp);
      expect(message.messageType).toBe(MessageType.TEXT);
      expect(message.isEdited).toBe(false);
      expect(message.isDeleted).toBe(false);
    });

    it('should apply default values correctly', async () => {
      const messageData = {
        content: 'Test message',
        senderId: 'user123',
        senderUsername: 'testuser',
        roomId: 'room123',
        timestamp: new Date(),
      };

      const message = await messageModel.create(messageData);

      expect(message.messageType).toBe(MessageType.TEXT);
      expect(message.isEdited).toBe(false);
      expect(message.isDeleted).toBe(false);
      expect(message.editedAt).toBeUndefined();
      expect(message.deletedAt).toBeUndefined();
      expect(message.senderAvatar).toBeUndefined();
    });

    it('should create a message with optional fields', async () => {
      const messageData = {
        content: 'Test message',
        senderId: 'user123',
        senderUsername: 'testuser',
        senderAvatar: 'https://example.com/avatar.jpg',
        roomId: 'room123',
        timestamp: new Date(),
        messageType: MessageType.IMAGE,
      };

      const message = await messageModel.create(messageData);

      expect(message.senderAvatar).toBe(messageData.senderAvatar);
      expect(message.messageType).toBe(MessageType.IMAGE);
    });
  });

  describe('Validation', () => {
    it('should fail when required fields are missing', async () => {
      const messageData = {
        content: 'Test message',
      };

      await expect(messageModel.create(messageData)).rejects.toThrow();
    });

    it('should fail when content is empty', async () => {
      const messageData = {
        content: '',
        senderId: 'user123',
        senderUsername: 'testuser',
        roomId: 'room123',
        timestamp: new Date(),
      };

      await expect(messageModel.create(messageData)).rejects.toThrow();
    });

    it('should fail when content exceeds maxlength', async () => {
      const messageData = {
        content: 'a'.repeat(2001),
        senderId: 'user123',
        senderUsername: 'testuser',
        roomId: 'room123',
        timestamp: new Date(),
      };

      await expect(messageModel.create(messageData)).rejects.toThrow();
    });

    it('should fail with invalid messageType', async () => {
      const messageData = {
        content: 'Test message',
        senderId: 'user123',
        senderUsername: 'testuser',
        roomId: 'room123',
        timestamp: new Date(),
        messageType: 'invalid' as MessageType,
      };

      await expect(messageModel.create(messageData)).rejects.toThrow();
    });
  });

  describe('Edited Messages', () => {
    it('should update edited fields correctly', async () => {
      const message = await messageModel.create({
        content: 'Original message',
        senderId: 'user123',
        senderUsername: 'testuser',
        roomId: 'room123',
        timestamp: new Date(),
      });

      const editedAt = new Date();
      message.isEdited = true;
      message.editedAt = editedAt;
      message.content = 'Edited message';
      await message.save();

      const updatedMessage = await messageModel.findById(message._id);
      expect(updatedMessage?.isEdited).toBe(true);
      expect(updatedMessage?.editedAt).toEqual(editedAt);
      expect(updatedMessage?.content).toBe('Edited message');
    });
  });

  describe('Deleted Messages', () => {
    it('should soft delete messages correctly', async () => {
      const message = await messageModel.create({
        content: 'Message to delete',
        senderId: 'user123',
        senderUsername: 'testuser',
        roomId: 'room123',
        timestamp: new Date(),
      });

      const deletedAt = new Date();
      message.isDeleted = true;
      message.deletedAt = deletedAt;
      await message.save();

      const deletedMessage = await messageModel.findById(message._id);
      expect(deletedMessage?.isDeleted).toBe(true);
      expect(deletedMessage?.deletedAt).toEqual(deletedAt);
    });
  });

  describe('JSON Transform', () => {
    it('should transform _id to id in JSON output', async () => {
      const message = await messageModel.create({
        content: 'Test message',
        senderId: 'user123',
        senderUsername: 'testuser',
        roomId: 'room123',
        timestamp: new Date(),
      });

      const json = message.toJSON() as unknown as MessageWithTimestamps;
      
      expect(json.id).toBeDefined();
      expect('_id' in json).toBe(false);
      expect('__v' in json).toBe(false);
      expect(typeof json.id).toBe('string');
      expect(json.id).toBe(message._id.toString());
    });

    it('should transform _id to id in object output', async () => {
      const message = await messageModel.create({
        content: 'Test message',
        senderId: 'user123',
        senderUsername: 'testuser',
        roomId: 'room123',
        timestamp: new Date(),
      });

      const obj = message.toObject() as unknown as MessageWithTimestamps;
      expect(obj.id).toBeDefined();
      expect('_id' in obj).toBe(false);
      expect('__v' in obj).toBe(false);
      expect(typeof obj.id).toBe('string');
      expect(obj.id).toBe(message._id.toString());
    });
  });

  describe('Timestamps', () => {
    it('should add createdAt and updatedAt timestamps', async () => {
      const message = await messageModel.create({
        content: 'Test message',
        senderId: 'user123',
        senderUsername: 'testuser',
        roomId: 'room123',
        timestamp: new Date(),
      });

      const messageWithTimestamps = message as unknown as MessageWithTimestamps;
      expect(messageWithTimestamps.createdAt).toBeDefined();
      expect(messageWithTimestamps.updatedAt).toBeDefined();
      expect(messageWithTimestamps.createdAt).toBeInstanceOf(Date);
      expect(messageWithTimestamps.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt on save', async () => {
      const message = await messageModel.create({
        content: 'Test message',
        senderId: 'user123',
        senderUsername: 'testuser',
        roomId: 'room123',
        timestamp: new Date(),
      });

      const messageWithTimestamps = message as unknown as MessageWithTimestamps;
      const originalUpdatedAt = messageWithTimestamps.updatedAt;

      await new Promise((resolve) => setTimeout(resolve, 10));

      message.content = 'Updated message';
      await message.save();

      const updatedMessageWithTimestamps =
        message as unknown as MessageWithTimestamps;
      expect(updatedMessageWithTimestamps.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });
  });

  describe('Indexes', () => {
    it('should have the correct indexes', async () => {
      const indexes = await messageModel.collection.listIndexes().toArray();
      const indexKeys = indexes.map((index: any) => index.key);

      expect(indexKeys).toContainEqual({ roomId: 1, timestamp: -1 });
      expect(indexKeys).toContainEqual({ senderId: 1 });
      expect(indexKeys).toContainEqual({ timestamp: -1 });
      expect(indexKeys).toContainEqual({ roomId: 1, isDeleted: 1 });
    });
  });
});
