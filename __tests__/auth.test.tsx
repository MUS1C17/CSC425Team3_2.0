import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from '@/components/login-form';
import { SignUpForm } from '@/components/sign-up-form';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// Mock the Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}));

// Mock the next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('Authentication Forms', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (createClient as jest.Mock).mockReturnValue({
      auth: {
        signInWithPassword: jest.fn(),
        signUp: jest.fn(),
        signInWithOAuth: jest.fn(),
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('LoginForm', () => {
    it('should show validation errors for invalid inputs', async () => {
      render(<LoginForm />);

      // Submit with empty fields
      fireEvent.click(screen.getByRole('button', { name: /login/i }));

      // Check for validation errors
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
        expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
      });
    });

    it('should call Supabase signInWithPassword on valid form submission', async () => {
      const mockSignIn = jest.fn().mockResolvedValue({ error: null });
      (createClient as jest.Mock).mockReturnValue({
        auth: {
          signInWithPassword: mockSignIn,
        },
      });

      render(<LoginForm />);

      // Fill in the form
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' },
      });

      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
        expect(mockRouter.push).toHaveBeenCalledWith('/protected');
      });
    });
  });

  describe('SignUpForm', () => {
    it('should show validation errors for invalid inputs', async () => {
      render(<SignUpForm />);

      // Submit with empty fields
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

      // Check for validation errors
      await waitFor(() => {
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
        expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
      });
    });

    it('should call Supabase signUp on valid form submission', async () => {
      const mockSignUp = jest.fn().mockResolvedValue({ error: null });
      (createClient as jest.Mock).mockReturnValue({
        auth: {
          signUp: mockSignUp,
        },
      });

      render(<SignUpForm />);

      // Fill in the form
      fireEvent.change(screen.getByLabelText(/first name/i), {
        target: { value: 'John' },
      });
      fireEvent.change(screen.getByLabelText(/last name/i), {
        target: { value: 'Doe' },
      });
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/^password/i), {
        target: { value: 'password123' },
      });
      fireEvent.change(screen.getByLabelText(/repeat password/i), {
        target: { value: 'password123' },
      });

      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
          options: expect.any(Object),
        });
        expect(mockRouter.push).toHaveBeenCalledWith('/auth/sign-up-success');
      });
    });
  });
});