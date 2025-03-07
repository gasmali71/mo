import { supabase } from '../supabase';
import type { Database } from '../types/database';

export async function getRecentResponses() {
  const { data, error } = await supabase
    .from('test_responses')
    .select(`
      *,
      test_sessions (
        id,
        student_id,
        evaluator_id,
        status
      ),
      questions (
        id,
        category,
        question
      )
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching recent responses:', error);
    throw error;
  }

  return data;
}

export async function getResponsesBySession(sessionId: string) {
  const { data, error } = await supabase
    .from('test_responses')
    .select(`
      *,
      questions (
        id,
        category,
        question
      )
    `)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching session responses:', error);
    throw error;
  }

  return data;
}

export async function getResponsesByStudent(studentId: string) {
  const { data, error } = await supabase
    .from('test_responses')
    .select(`
      *,
      test_sessions!inner (
        id,
        student_id,
        status
      ),
      questions (
        id,
        category,
        question
      )
    `)
    .eq('test_sessions.student_id', studentId)
    .eq('test_sessions.status', 'completed')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching student responses:', error);
    throw error;
  }

  return data;
}
