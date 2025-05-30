import { render, screen } from '@testing-library/react';
import App from './app';

// Mock dependencies
jest.mock('@/lib/api', () => ({
  authApi: {
    profile: jest.fn(),
  },
  tokenUtils: {
    get: jest.fn().mockReturnValue(null),
    set: jest.fn(),
    remove: jest.fn(),
  },
}));

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connected: false,
  })),
}));

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render successfully', () => {
    const { baseElement } = render(<App />);
    expect(baseElement).toBeTruthy();
  });

  it('should redirect to login when no user is authenticated', async () => {
    render(<App />);

    expect(screen.getByText('Connexion')).toBeInTheDocument();
  });
});
