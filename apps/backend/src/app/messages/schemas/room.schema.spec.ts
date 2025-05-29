import mongoose, { Connection, Model } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import {
  Room,
  RoomType,
  RoomSchema,
  MemberRole,
  RoomMember,
} from '@backend/messages/schemas/room.schema';

interface RoomWithTimestamps extends Room {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

interface IndexInfo {
  key: Record<string, number>;
  name: string;
  v?: number;
}

describe('RoomSchema', () => {
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;
  let roomModel: Model<Room>;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    mongoConnection = mongoose.createConnection(uri);
    roomModel = mongoConnection.model('Room', RoomSchema);
    
    await roomModel.createIndexes();
  });

  afterAll(async () => {
    await mongoConnection.close();
    await mongod.stop();
  });

  afterEach(async () => {
    await roomModel.deleteMany({});
  });

  describe('Document Creation', () => {
    it('should create a room with all required fields', async () => {
      const roomData = {
        name: 'Test Room',
        type: RoomType.DIRECT,
        createdBy: 'user123',
      };

      const room = await roomModel.create(roomData);

      expect(room.name).toBe(roomData.name);
      expect(room.type).toBe(roomData.type);
      expect(room.createdBy).toBe(roomData.createdBy);
      expect(room.members).toEqual([]);
      expect(room.isActive).toBe(true);
      expect(room.description).toBeUndefined();
      expect(room.lastActivity).toBeUndefined();
    });

    it('should apply default values correctly', async () => {
      const roomData = {
        name: 'Test Room',
        type: RoomType.DIRECT,
        createdBy: 'user123',
      };

      const room = await roomModel.create(roomData);

      expect(room.isActive).toBe(true);
      expect(room.members).toEqual([]);
    });

    it('should create a room with optional fields', async () => {
      const roomData = {
        name: 'Test Room',
        type: RoomType.DIRECT,
        description: 'A test room description',
        createdBy: 'user123',
        lastActivity: new Date(),
      };

      const room = await roomModel.create(roomData);

      expect(room.description).toBe(roomData.description);
      expect(room.lastActivity).toEqual(roomData.lastActivity);
    });
  });

  describe('Members', () => {
    it('should add members to a room', async () => {
      const room = await roomModel.create({
        name: 'Test Room',
        type: RoomType.DIRECT,
        createdBy: 'user123',
      });

      const memberData: RoomMember[] = [
        {
          userId: 'user123',
          role: MemberRole.ADMIN,
          joinedAt: new Date(),
        },
        {
          userId: 'user456',
          role: MemberRole.MEMBER,
          joinedAt: new Date(),
        },
      ];

      room.members = memberData;
      await room.save();

      const updatedRoom = await roomModel.findById(room._id);
      expect(updatedRoom?.members).toHaveLength(2);
      expect(updatedRoom?.members[0].userId).toBe('user123');
      expect(updatedRoom?.members[0].role).toBe(MemberRole.ADMIN);
      expect(updatedRoom?.members[1].userId).toBe('user456');
      expect(updatedRoom?.members[1].role).toBe(MemberRole.MEMBER);
    });

    it('should apply default role to members', async () => {
      const room = await roomModel.create({
        name: 'Test Room',
        type: RoomType.DIRECT,
        createdBy: 'user123',
        members: [
          {
            userId: 'user123',
            joinedAt: new Date(),
          },
        ],
      });

      expect(room.members[0].role).toBe(MemberRole.MEMBER);
    });

    it('should track member left date', async () => {
      const room = await roomModel.create({
        name: 'Test Room',
        type: RoomType.DIRECT,
        createdBy: 'user123',
        members: [
          {
            userId: 'user123',
            role: MemberRole.ADMIN,
            joinedAt: new Date(),
          },
        ],
      });

      const leftAt = new Date();
      room.members[0].leftAt = leftAt;
      await room.save();

      const updatedRoom = await roomModel.findById(room._id);
      expect(updatedRoom?.members[0].leftAt).toEqual(leftAt);
    });
  });

  describe('Validation', () => {
    it('should fail when required fields are missing', async () => {
      const roomData = {
        name: 'Test Room',
      };

      await expect(roomModel.create(roomData)).rejects.toThrow();
    });

    it('should fail when name is empty', async () => {
      const roomData = {
        name: '',
        type: RoomType.DIRECT,
        createdBy: 'user123',
      };

      await expect(roomModel.create(roomData)).rejects.toThrow();
    });

    it('should fail when name exceeds maxlength', async () => {
      const roomData = {
        name: 'a'.repeat(101),
        type: RoomType.DIRECT,
        createdBy: 'user123',
      };

      await expect(roomModel.create(roomData)).rejects.toThrow();
    });

    it('should fail when description exceeds maxlength', async () => {
      const roomData = {
        name: 'Test Room',
        type: RoomType.DIRECT,
        description: 'a'.repeat(501),
        createdBy: 'user123',
      };

      await expect(roomModel.create(roomData)).rejects.toThrow();
    });

    it('should fail with invalid room type', async () => {
      const roomData = {
        name: 'Test Room',
        type: 'invalid' as RoomType,
        createdBy: 'user123',
      };

      await expect(roomModel.create(roomData)).rejects.toThrow();
    });

    it('should fail with invalid member role', async () => {
      const roomData = {
        name: 'Test Room',
        type: RoomType.DIRECT,
        createdBy: 'user123',
        members: [
          {
            userId: 'user123',
            role: 'invalid' as MemberRole,
            joinedAt: new Date(),
          },
        ],
      };

      await expect(roomModel.create(roomData)).rejects.toThrow();
    });
  });

  describe('JSON Transform', () => {
    it('should transform _id to id in JSON output', async () => {
      const room = await roomModel.create({
        name: 'Test Room',
        type: RoomType.DIRECT,
        createdBy: 'user123',
      });

      const json = room.toJSON() as unknown as RoomWithTimestamps;
      expect(json.id).toBeDefined();
      expect('_id' in json).toBe(false);
      expect('__v' in json).toBe(false);
      expect(typeof json.id).toBe('string');
      expect(json.id).toBe(room._id.toString());
    });

    it('should transform _id to id in object output', async () => {
      const room = await roomModel.create({
        name: 'Test Room',
        type: RoomType.DIRECT,
        createdBy: 'user123',
      });

      const obj = room.toObject() as unknown as RoomWithTimestamps;
      expect(obj.id).toBeDefined();
      expect('_id' in obj).toBe(false);
      expect('__v' in obj).toBe(false);
      expect(typeof obj.id).toBe('string');
      expect(obj.id).toBe(room._id.toString());
    });
  });

  describe('Timestamps', () => {
    it('should add createdAt and updatedAt timestamps', async () => {
      const room = await roomModel.create({
        name: 'Test Room',
        type: RoomType.DIRECT,
        createdBy: 'user123',
      });

      const roomWithTimestamps = room as unknown as RoomWithTimestamps;
      expect(roomWithTimestamps.createdAt).toBeDefined();
      expect(roomWithTimestamps.updatedAt).toBeDefined();
      expect(roomWithTimestamps.createdAt).toBeInstanceOf(Date);
      expect(roomWithTimestamps.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt on save', async () => {
      const room = await roomModel.create({
        name: 'Test Room',
        type: RoomType.DIRECT,
        createdBy: 'user123',
      });

      const roomWithTimestamps = room as unknown as RoomWithTimestamps;
      const originalUpdatedAt = roomWithTimestamps.updatedAt;

      await new Promise((resolve) => setTimeout(resolve, 10));

      room.name = 'Updated Room';
      await room.save();

      const updatedRoomWithTimestamps = room as unknown as RoomWithTimestamps;
      expect(updatedRoomWithTimestamps.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });
  });

  describe('Indexes', () => {
    it('should have the correct indexes', async () => {
      const indexes = await roomModel.collection.listIndexes().toArray();
      const indexKeys = indexes.map((index: any) => index.key);

      expect(indexKeys).toContainEqual({ type: 1 });
      expect(indexKeys).toContainEqual({ 'members.userId': 1 });
      expect(indexKeys).toContainEqual({ createdBy: 1 });
      expect(indexKeys).toContainEqual({ isActive: 1 });
    });
  });

  describe('Room States', () => {
    it('should toggle room active state', async () => {
      const room = await roomModel.create({
        name: 'Test Room',
        type: RoomType.DIRECT,
        createdBy: 'user123',
      });

      expect(room.isActive).toBe(true);

      room.isActive = false;
      await room.save();

      const updatedRoom = await roomModel.findById(room._id);
      expect(updatedRoom?.isActive).toBe(false);
    });

    it('should update lastActivity', async () => {
      const room = await roomModel.create({
        name: 'Test Room',
        type: RoomType.DIRECT,
        createdBy: 'user123',
      });

      const activity = new Date();
      room.lastActivity = activity;
      await room.save();

      const updatedRoom = await roomModel.findById(room._id);
      expect(updatedRoom?.lastActivity).toEqual(activity);
    });
  });
});
