export const AUTH_CONSTANTS = {
  JWT_SECRET: process.env.JWT_SECRET || 'production-key-change',
  JWT_EXPIRATION: process.env.JWT_EXPIRATION || '1h',
  BCRYPT_ROUNDS: 10,
};

export const IS_PUBLIC_KEY = 'isPublic';
