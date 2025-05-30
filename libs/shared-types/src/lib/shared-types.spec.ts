import { User } from './user.types.js';

describe('shared-types', () => {
  it('should export User type', () => {
    const user: User = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      username: 'testuser',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(user).toBeDefined();
  });
});