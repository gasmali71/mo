import { describe, test, expect, beforeEach } from 'vitest';
import { signIn, signUp, resetPassword, getValidationLogs, clearValidationLogs } from './auth';

describe('Authentication Flow Tests', () => {
  beforeEach(() => {
    clearValidationLogs();
  });

  describe('Login Flow', () => {
    test('successful login with valid credentials', async () => {
      try {
        const result = await signIn('test@example.com', 'TestPass123!');
        const logs = getValidationLogs();
        
        // Verify validation steps
        expect(logs).toContainEqual(expect.objectContaining({
          step: 'Login Attempt',
          status: 'success'
        }));
        
        expect(logs).toContainEqual(expect.objectContaining({
          step: 'Email Validation',
          status: 'success'
        }));

        // Verify successful login
        expect(result.user).toBeDefined();
        expect(result.user?.email).toBe('test@example.com');
        
      } catch (error) {
        console.error('Login test failed:', error);
        throw error;
      }
    });

    test('invalid credentials handling', async () => {
      try {
        await signIn('test@example.com', 'WrongPassword123!');
      } catch (error) {
        const logs = getValidationLogs();
        
        // Verify error handling
        expect(logs).toContainEqual(expect.objectContaining({
          step: 'Login Error',
          status: 'error',
          details: expect.objectContaining({
            errorCode: 400,
            errorMessage: 'Invalid login credentials'
          })
        }));
        
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Email ou mot de passe incorrect');
      }
    });
  });

  describe('Signup Flow', () => {
    test('password validation rules', async () => {
      try {
        await signUp('new@example.com', 'weakpass');
      } catch (error) {
        const logs = getValidationLogs();
        
        // Verify password validation
        expect(logs).toContainEqual(expect.objectContaining({
          step: 'Password Validation',
          status: 'error',
          details: expect.objectContaining({
            meetsLengthRequirement: false,
            hasUpperCase: false,
            hasNumber: false
          })
        }));
        
        expect(error.message).toContain('Le mot de passe doit contenir');
      }
    });

    test('successful signup with valid data', async () => {
      try {
        const result = await signUp('new@example.com', 'ValidPass123', {
          full_name: 'Test User'
        });
        const logs = getValidationLogs();
        
        // Verify validation steps
        expect(logs).toContainEqual(expect.objectContaining({
          step: 'Signup Attempt',
          status: 'success'
        }));
        
        expect(logs).toContainEqual(expect.objectContaining({
          step: 'Password Validation',
          status: 'success'
        }));
        
        // Verify successful signup
        expect(result.user).toBeDefined();
        expect(result.user?.email).toBe('new@example.com');
        
      } catch (error) {
        console.error('Signup test failed:', error);
        throw error;
      }
    });
  });

  describe('Password Reset Flow', () => {
    test('email validation for reset', async () => {
      try {
        await resetPassword('invalid-email');
      } catch (error) {
        const logs = getValidationLogs();
        
        // Verify email validation
        expect(logs).toContainEqual(expect.objectContaining({
          step: 'Email Validation',
          status: 'error',
          details: expect.objectContaining({
            isValidFormat: false
          })
        }));
        
        expect(error.message).toBe('L\'adresse email n\'est pas valide');
      }
    });

    test('successful reset request', async () => {
      try {
        await resetPassword('test@example.com');
        const logs = getValidationLogs();
        
        // Verify reset flow
        expect(logs).toContainEqual(expect.objectContaining({
          step: 'Password Reset Request',
          status: 'success'
        }));
        
        expect(logs).toContainEqual(expect.objectContaining({
          step: 'Password Reset Email Sent',
          status: 'success'
        }));
        
      } catch (error) {
        console.error('Reset test failed:', error);
        throw error;
      }
    });
  });
});
