import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Connection, Model } from 'mongoose';

import { OnlineUser, OnlineUserSchema, UserStatus } from '@backend/messages/schemas/online-user.schema';

interface OnlineUserWithTimestamps extends OnlineUser {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

interface IndexInfo {
  key: Record<string, number>;
  name: string;
  v?: number;
  expireAfterSeconds?: number;
}

describe('OnlineUserSchema', () => {
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;
  let onlineUserModel: Model<OnlineUser>;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    mongoConnection = mongoose.createConnection(uri);
    onlineUserModel = mongoConnection.model('OnlineUser', OnlineUserSchema);
    
    await onlineUserModel.createIndexes();
  });

  afterAll(async () => {
    await mongoConnection.close();
    await mongod.stop();
  });

  afterEach(async () => {
    await onlineUserModel.deleteMany({});
  });

  describe('Document Creation', () => {
    it('should create an online user with all required fields', async () => {
      const userData = {
        userId: 'user123',
        socketId: 'socket123',
        lastSeen: new Date(),
      };

      const user = await onlineUserModel.create(userData);

      expect(user.userId).toBe(userData.userId);
      expect(user.socketId).toBe(userData.socketId);
      expect(user.lastSeen).toEqual(userData.lastSeen);
      expect(user.status).toBe(UserStatus.ONLINE);
    });

    it('should apply default values correctly', async () => {
      const userData = {
        userId: 'user123',
        socketId: 'socket123',
      };

      const user = await onlineUserModel.create(userData);

      expect(user.status).toBe(UserStatus.ONLINE);
      expect(user.lastSeen).toBeDefined();
      expect(user.lastSeen).toBeInstanceOf(Date);
    });

    it('should create an online user with custom status', async () => {
      const userData = {
        userId: 'user123',
        socketId: 'socket123',
        status: UserStatus.AWAY,
        lastSeen: new Date(),
      };

      const user = await onlineUserModel.create(userData);

      expect(user.status).toBe(UserStatus.AWAY);
    });
  });

  describe('Validation', () => {
    it('should fail when required fields are missing', async () => {
      const userData = {
        userId: 'user123',
      };

      await expect(onlineUserModel.create(userData)).rejects.toThrow();
    });

    it('should fail when userId is empty', async () => {
      const userData = {
        userId: '',
        socketId: 'socket123',
      };

      await expect(onlineUserModel.create(userData)).rejects.toThrow();
    });

    it('should fail with invalid status', async () => {
      const userData = {
        userId: 'user123',
        socketId: 'socket123',
        status: 'invalid' as UserStatus,
      };

      await expect(onlineUserModel.create(userData)).rejects.toThrow();
    });
  });

  describe('Unique Constraints', () => {
    it('should enforce unique userId constraint', async () => {
      const userData = {
        userId: 'user123',
        socketId: 'socket123',
      };

      await onlineUserModel.create(userData);

      const duplicateData = {
        userId: 'user123',
        socketId: 'socket456',
      };

      await expect(onlineUserModel.create(duplicateData)).rejects.toThrow();
    });

    it('should enforce unique socketId constraint', async () => {
      const userData = {
        userId: 'user123',
        socketId: 'socket123',
      };

      await onlineUserModel.create(userData);

      const duplicateData = {
        userId: 'user456',
        socketId: 'socket123',
      };

      await expect(onlineUserModel.create(duplicateData)).rejects.toThrow();
    });

    it('should allow updating the same user', async () => {
      const user = await onlineUserModel.create({
        userId: 'user123',
        socketId: 'socket123',
      });

      user.status = UserStatus.AWAY;
      user.lastSeen = new Date();

      await expect(user.save()).resolves.toBeDefined();
    });
  });

  describe('Status Management', () => {
    it('should update user status', async () => {
      const user = await onlineUserModel.create({
        userId: 'user123',
        socketId: 'socket123',
      });

      expect(user.status).toBe(UserStatus.ONLINE);

      user.status = UserStatus.AWAY;
      await user.save();

      const updatedUser = await onlineUserModel.findById(user._id);
      expect(updatedUser?.status).toBe(UserStatus.AWAY);
    });

    it('should update lastSeen timestamp', async () => {
      const user = await onlineUserModel.create({
        userId: 'user123',
        socketId: 'socket123',
      });

      const originalLastSeen = user.lastSeen;

      await new Promise((resolve) => setTimeout(resolve, 10));

      const newLastSeen = new Date();
      user.lastSeen = newLastSeen;
      await user.save();

      const updatedUser = await onlineUserModel.findById(user._id);
      expect(updatedUser?.lastSeen.getTime()).toBeGreaterThan(
        originalLastSeen.getTime()
      );
    });
  });

  describe('JSON Transform', () => {
    it('should transform _id to id in JSON output', async () => {
      const user = await onlineUserModel.create({
        userId: 'user123',
        socketId: 'socket123',
      });

      const json = user.toJSON() as unknown as OnlineUserWithTimestamps;
      expect(json.id).toBeDefined();
      expect('_id' in json).toBe(false);
      expect('__v' in json).toBe(false);
      expect(typeof json.id).toBe('string');
      expect(json.id).toBe(user._id.toString());
    });

    it('should transform _id to id in object output', async () => {
      const user = await onlineUserModel.create({
        userId: 'user123',
        socketId: 'socket123',
      });

      const obj = user.toObject() as unknown as OnlineUserWithTimestamps;
      expect(obj.id).toBeDefined();
      expect('_id' in obj).toBe(false);
      expect('__v' in obj).toBe(false);
      expect(typeof obj.id).toBe('string');
      expect(obj.id).toBe(user._id.toString());
    });
  });

  describe('Timestamps', () => {
    it('should add createdAt and updatedAt timestamps', async () => {
      const user = await onlineUserModel.create({
        userId: 'user123',
        socketId: 'socket123',
      });

      const userWithTimestamps = user as unknown as OnlineUserWithTimestamps;
      expect(userWithTimestamps.createdAt).toBeDefined();
      expect(userWithTimestamps.updatedAt).toBeDefined();
      expect(userWithTimestamps.createdAt).toBeInstanceOf(Date);
      expect(userWithTimestamps.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt on save', async () => {
      const user = await onlineUserModel.create({
        userId: 'user123',
        socketId: 'socket123',
      });

      const userWithTimestamps = user as unknown as OnlineUserWithTimestamps;
      const originalUpdatedAt = userWithTimestamps.updatedAt;

      await new Promise((resolve) => setTimeout(resolve, 10));

      user.status = UserStatus.AWAY;
      await user.save();

      const updatedUserWithTimestamps =
        user as unknown as OnlineUserWithTimestamps;
      expect(updatedUserWithTimestamps.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });
  });

  describe('Indexes', () => {
    it('should have the correct indexes', async () => {
      const indexes = await onlineUserModel.collection.listIndexes().toArray();
      const indexKeys = indexes.map((index: any) => index.key);

      expect(indexKeys).toContainEqual({ userId: 1 });
      expect(indexKeys).toContainEqual({ socketId: 1 });
      expect(indexKeys).toContainEqual({ status: 1 });
      expect(indexKeys).toContainEqual({ lastSeen: 1 });
    });

    it('should have TTL index on lastSeen', async () => {
      const indexes = await onlineUserModel.collection.listIndexes().toArray();
      const lastSeenIndex = indexes.find(
        (index: any) =>
          index.key &&
          index.key.lastSeen === 1 &&
          index.expireAfterSeconds !== undefined
      );

      expect(lastSeenIndex).toBeDefined();
      expect(lastSeenIndex?.expireAfterSeconds).toBe(300);
    });
  });

  describe('TTL Behavior', () => {
    it('should have TTL index configured for automatic cleanup', async () => {
      const user = await onlineUserModel.create({
        userId: 'user123',
        socketId: 'socket123',
        lastSeen: new Date(Date.now() - 301 * 1000),
      });

      expect(user).toBeDefined();
      expect(user.lastSeen).toBeDefined();
      
      const indexes = await onlineUserModel.collection.listIndexes().toArray();
      const lastSeenIndex = indexes.find(
        (index: any) => index.key?.lastSeen === 1 && index.expireAfterSeconds !== undefined
      );
      
      expect(lastSeenIndex?.expireAfterSeconds).toBe(300);
    });
  });
});
