import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterPage from './Register';
import { RegisterCredentials } from '@shared-types';

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn(),
}));

describe('RegisterPage', () => {
  const mockOnRegister = jest.fn();
  const mockOnNavigateToLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render register form with all elements', () => {
    render(
      <RegisterPage
        onRegister={mockOnRegister}
        onNavigateToLogin={mockOnNavigateToLogin}
      />
    );

    expect(screen.getByText('Inscription')).toBeInTheDocument();
    expect(
      screen.getByText('Créez votre compte pour commencer')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Prénom')).toBeInTheDocument();
    expect(screen.getByLabelText('Nom')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Confirmer le mot de passe')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: "S'inscrire" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Déjà un compte ? Se connecter' })
    ).toBeInTheDocument();
  });

  it('should update input values when typing', async () => {
    const user = userEvent.setup();
    render(
      <RegisterPage
        onRegister={mockOnRegister}
        onNavigateToLogin={mockOnNavigateToLogin}
      />
    );

    const firstNameInput = screen.getByLabelText('Prénom');
    const lastNameInput = screen.getByLabelText('Nom');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Mot de passe');
    const confirmPasswordInput = screen.getByLabelText(
      'Confirmer le mot de passe'
    );

    await user.type(firstNameInput, 'John');
    await user.type(lastNameInput, 'Doe');
    await user.type(emailInput, 'john@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');

    expect(firstNameInput).toHaveValue('John');
    expect(lastNameInput).toHaveValue('Doe');
    expect(emailInput).toHaveValue('john@example.com');
    expect(passwordInput).toHaveValue('password123');
    expect(confirmPasswordInput).toHaveValue('password123');
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    render(
      <RegisterPage
        onRegister={mockOnRegister}
        onNavigateToLogin={mockOnNavigateToLogin}
      />
    );

    const submitButton = screen.getByRole('button', { name: "S'inscrire" });
    await user.click(submitButton);

    expect(screen.getByText("L'email est requis")).toBeInTheDocument();
    expect(screen.getByText('Le prénom est requis')).toBeInTheDocument();
    expect(screen.getByText('Le nom est requis')).toBeInTheDocument();
    expect(screen.getByText('Le mot de passe est requis')).toBeInTheDocument();
    expect(mockOnRegister).not.toHaveBeenCalled();
  });

  it('should validate password length', async () => {
    const user = userEvent.setup();
    render(
      <RegisterPage
        onRegister={mockOnRegister}
        onNavigateToLogin={mockOnNavigateToLogin}
      />
    );

    const passwordInput = screen.getByLabelText('Mot de passe');
    await user.type(passwordInput, '12345');

    const submitButton = screen.getByRole('button', { name: "S'inscrire" });
    await user.click(submitButton);

    expect(
      screen.getByText('Le mot de passe doit contenir au moins 6 caractères')
    ).toBeInTheDocument();
    expect(mockOnRegister).not.toHaveBeenCalled();
  });

  it('should validate password confirmation', async () => {
    const user = userEvent.setup();
    render(
      <RegisterPage
        onRegister={mockOnRegister}
        onNavigateToLogin={mockOnNavigateToLogin}
      />
    );

    const passwordInput = screen.getByLabelText('Mot de passe');
    const confirmPasswordInput = screen.getByLabelText(
      'Confirmer le mot de passe'
    );

    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password456');

    const submitButton = screen.getByRole('button', { name: "S'inscrire" });
    await user.click(submitButton);

    expect(
      screen.getByText('Les mots de passe ne correspondent pas')
    ).toBeInTheDocument();
    expect(mockOnRegister).not.toHaveBeenCalled();
  });

  it('should call onRegister with valid form data', async () => {
    const user = userEvent.setup();
    render(
      <RegisterPage
        onRegister={mockOnRegister}
        onNavigateToLogin={mockOnNavigateToLogin}
      />
    );

    await user.type(screen.getByLabelText('Prénom'), 'John');
    await user.type(screen.getByLabelText('Nom'), 'Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText('Mot de passe'), 'password123');
    await user.type(
      screen.getByLabelText('Confirmer le mot de passe'),
      'password123'
    );

    const submitButton = screen.getByRole('button', { name: "S'inscrire" });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnRegister).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
      } as RegisterCredentials);
    });
  });

  it('should disable inputs and show loading state during registration', async () => {
    const user = userEvent.setup();
    mockOnRegister.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(
      <RegisterPage
        onRegister={mockOnRegister}
        onNavigateToLogin={mockOnNavigateToLogin}
      />
    );

    await user.type(screen.getByLabelText('Prénom'), 'John');
    await user.type(screen.getByLabelText('Nom'), 'Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText('Mot de passe'), 'password123');
    await user.type(
      screen.getByLabelText('Confirmer le mot de passe'),
      'password123'
    );

    const submitButton = screen.getByRole('button', { name: "S'inscrire" });
    await user.click(submitButton);

    expect(screen.getByLabelText('Prénom')).toBeDisabled();
    expect(screen.getByLabelText('Nom')).toBeDisabled();
    expect(screen.getByLabelText('Email')).toBeDisabled();
    expect(screen.getByLabelText('Mot de passe')).toBeDisabled();
    expect(screen.getByLabelText('Confirmer le mot de passe')).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Inscription...' })
    ).toBeDisabled();

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: "S'inscrire" })
      ).not.toBeDisabled();
    });
  });

  it('should handle registration errors', async () => {
    const { toast } = require('@/hooks/use-toast');
    const user = userEvent.setup();
    mockOnRegister.mockRejectedValue(new Error('Email already exists'));

    render(
      <RegisterPage
        onRegister={mockOnRegister}
        onNavigateToLogin={mockOnNavigateToLogin}
      />
    );

    await user.type(screen.getByLabelText('Prénom'), 'John');
    await user.type(screen.getByLabelText('Nom'), 'Doe');
    await user.type(screen.getByLabelText('Email'), 'john@example.com');
    await user.type(screen.getByLabelText('Mot de passe'), 'password123');
    await user.type(
      screen.getByLabelText('Confirmer le mot de passe'),
      'password123'
    );

    const submitButton = screen.getByRole('button', { name: "S'inscrire" });
    await user.click(submitButton);

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith({
        title: 'Erreur',
        variant: 'destructive',
        description: 'Une erreur est survenue lors de la création du compte',
      });
    });
  });

  it('should call onNavigateToLogin when login link is clicked', async () => {
    const user = userEvent.setup();
    render(
      <RegisterPage
        onRegister={mockOnRegister}
        onNavigateToLogin={mockOnNavigateToLogin}
      />
    );

    const loginLink = screen.getByRole('button', {
      name: 'Déjà un compte ? Se connecter',
    });
    await user.click(loginLink);

    expect(mockOnNavigateToLogin).toHaveBeenCalled();
  });

  it('should clear validation errors when user starts typing', async () => {
    const user = userEvent.setup();
    render(
      <RegisterPage
        onRegister={mockOnRegister}
        onNavigateToLogin={mockOnNavigateToLogin}
      />
    );

    const submitButton = screen.getByRole('button', { name: "S'inscrire" });
    await user.click(submitButton);

    expect(screen.getByText("L'email est requis")).toBeInTheDocument();

    const emailInput = screen.getByLabelText('Email');
    await user.type(emailInput, 'j');

    expect(screen.queryByText("L'email est requis")).not.toBeInTheDocument();
  });
});
