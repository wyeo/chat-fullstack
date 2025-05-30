export default {
  displayName: '@chat-fullstack/frontend',
  preset: '../../jest.preset.js',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: 'test-output/jest/coverage',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '\\.css$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared-constants$': '<rootDir>/../../libs/shared-constants/src/index.ts',
    '^@shared-types$': '<rootDir>/../../libs/shared-types/src/index.ts',
    '^@shared-utils$': '<rootDir>/../../libs/shared-utils/src/index.ts',
  },
};
