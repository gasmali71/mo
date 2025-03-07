import { supabase } from './supabase';
import type { User, AuthError } from '@supabase/supabase-js';

// Validation constants
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validatePassword(password: string): boolean {
  return PASSWORD_REGEX.test(password);
}

function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export async function signIn(email: string, password: string) {
  try {
    if (!validateEmail(email)) {
      throw new Error('L\'adresse email n\'est pas valide');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    return data.user;
  } catch (error) {
    console.error('Sign in error:', error);
    if (error instanceof Error) {
      if ((error as AuthError).status === 400) {
        throw new Error('Email ou mot de passe incorrect');
      }
      throw error;
    }
    throw new Error('Une erreur est survenue lors de la connexion');
  }
}

export async function signUp(email: string, password: string, metadata?: { full_name?: string; plan_type?: string }) {
  try {
    if (!validateEmail(email)) {
      throw new Error('L\'adresse email n\'est pas valide');
    }

    if (!validatePassword(password)) {
      throw new Error('Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial');
    }

    // First, check if user exists
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      throw new Error('Un compte existe déjà avec cette adresse email');
    }

    // Create auth user
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: metadata?.full_name || '',
          plan_type: metadata?.plan_type || 'freemium'
        }
      }
    });

    if (signUpError) throw signUpError;
    if (!data.user) throw new Error('Erreur lors de la création du compte');

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: data.user.id,
        email: email,
        full_name: metadata?.full_name || '',
        plan_type: metadata?.plan_type || 'freemium'
      });

    if (profileError) {
      // Rollback auth user creation
      await supabase.auth.admin.deleteUser(data.user.id);
      throw new Error('Erreur lors de la création du profil utilisateur');
    }

    return data.user;
  } catch (error) {
    console.error('Sign up error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Une erreur est survenue lors de l\'inscription');
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Sign out error:', error);
    throw new Error('Une erreur est survenue lors de la déconnexion');
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function resetPassword(email: string) {
  try {
    if (!validateEmail(email)) {
      throw new Error('L\'adresse email n\'est pas valide');
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-confirmation`
    });

    if (error) throw error;
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
}

export async function updatePassword(newPassword: string) {
  try {
    if (!validatePassword(newPassword)) {
      throw new Error('Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial');
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
  } catch (error) {
    console.error('Password update error:', error);
    throw error;
  }
}

export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw new Error('Impossible de récupérer le profil utilisateur');
  }
}
