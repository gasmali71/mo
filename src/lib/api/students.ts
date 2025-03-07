import { supabase } from '../supabase';
import type { Database } from '../types/database';
import type { Student, Guardian, TestSession, TestResponse } from '../types/database';

export async function createStudent(data: Database['public']['Tables']['students']['Insert']) {
  const { data: student, error } = await supabase
    .from('students')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return student;
}

export async function getStudent(id: string) {
  const { data: student, error } = await supabase
    .from('students')
    .select(`
      *,
      guardians (*),
      test_sessions (
        *,
        test_responses (*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return student;
}

export async function updateStudent(
  id: string,
  data: Database['public']['Tables']['students']['Update']
) {
  const { data: student, error } = await supabase
    .from('students')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return student;
}

export async function createGuardian(data: Database['public']['Tables']['guardians']['Insert']) {
  const { data: guardian, error } = await supabase
    .from('guardians')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return guardian;
}

export async function createTestSession(
  data: Database['public']['Tables']['test_sessions']['Insert']
) {
  const { data: session, error } = await supabase
    .from('test_sessions')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return session;
}

export async function updateTestSession(
  id: string,
  data: Database['public']['Tables']['test_sessions']['Update']
) {
  const { data: session, error } = await supabase
    .from('test_sessions')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return session;
}

export async function createTestResponse(
  data: Database['public']['Tables']['test_responses']['Insert']
) {
  const { data: response, error } = await supabase
    .from('test_responses')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return response;
}

export async function getStudentProgress(studentId: string) {
  const { data: sessions, error } = await supabase
    .from('test_sessions')
    .select(`
      *,
      test_responses (*)
    `)
    .eq('student_id', studentId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) throw error;
  return sessions;
}
