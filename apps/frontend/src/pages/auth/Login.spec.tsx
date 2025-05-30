import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from './Login';
import { LoginCredentials } from '@shared-types';

describe('LoginPage', () => {
  const mockOnLogin = jest.fn();
  const mockOnNavigateToRegister = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render login form with all elements', () => {
    render(
      <LoginPage
        onLogin={mockOnLogin}
        onNavigateToRegister={mockOnNavigateToRegister}
      />
    );

    expect(screen.getByText('Connexion')).toBeInTheDocument();
    expect(
      screen.getByText('Entrez vos identifiants pour accéder à votre compte')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Se connecter' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: "Pas encore de compte ? S'inscrire" })
    ).toBeInTheDocument();
  });

  it('should update input values when typing', async () => {
    const user = userEvent.setup();
    render(
      <LoginPage
        onLogin={mockOnLogin}
        onNavigateToRegister={mockOnNavigateToRegister}
      />
    );

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Mot de passe');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('should not submit form with empty fields', async () => {
    const user = userEvent.setup();
    render(
      <LoginPage
        onLogin={mockOnLogin}
        onNavigateToRegister={mockOnNavigateToRegister}
      />
    );

    const submitButton = screen.getByRole('button', { name: 'Se connecter' });
    await user.click(submitButton);

    expect(mockOnLogin).not.toHaveBeenCalled();
  });

  it('should call onLogin with credentials when form is submitted', async () => {
    const user = userEvent.setup();
    render(
      <LoginPage
        onLogin={mockOnLogin}
        onNavigateToRegister={mockOnNavigateToRegister}
      />
    );

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Mot de passe');
    const submitButton = screen.getByRole('button', { name: 'Se connecter' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      } as LoginCredentials);
    });
  });

  it('should disable inputs and show loading state during login', async () => {
    const user = userEvent.setup();
    mockOnLogin.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(
      <LoginPage
        onLogin={mockOnLogin}
        onNavigateToRegister={mockOnNavigateToRegister}
      />
    );

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Mot de passe');
    const submitButton = screen.getByRole('button', { name: 'Se connecter' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Connexion...' })).toBeDisabled();

    await waitFor(() => {
      expect(emailInput).not.toBeDisabled();
      expect(passwordInput).not.toBeDisabled();
      expect(
        screen.getByRole('button', { name: 'Se connecter' })
      ).not.toBeDisabled();
    });
  });

  it('should handle login errors gracefully', async () => {
    const user = userEvent.setup();
    mockOnLogin.mockRejectedValue(new Error('Invalid credentials'));

    render(
      <LoginPage
        onLogin={mockOnLogin}
        onNavigateToRegister={mockOnNavigateToRegister}
      />
    );

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Mot de passe');
    const submitButton = screen.getByRole('button', { name: 'Se connecter' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(emailInput).not.toBeDisabled();
      expect(passwordInput).not.toBeDisabled();
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('should call onNavigateToRegister when register link is clicked', async () => {
    const user = userEvent.setup();
    render(
      <LoginPage
        onLogin={mockOnLogin}
        onNavigateToRegister={mockOnNavigateToRegister}
      />
    );

    const registerLink = screen.getByRole('button', {
      name: "Pas encore de compte ? S'inscrire",
    });
    await user.click(registerLink);

    expect(mockOnNavigateToRegister).toHaveBeenCalled();
  });

  it('should submit form when Enter key is pressed', async () => {
    const user = userEvent.setup();
    render(
      <LoginPage
        onLogin={mockOnLogin}
        onNavigateToRegister={mockOnNavigateToRegister}
      />
    );

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Mot de passe');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123{Enter}');

    await waitFor(() => {
      expect(mockOnLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });
});
