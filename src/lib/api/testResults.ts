import { supabase } from '../supabase';
import type { Database } from '../types/database';

export interface TestResult {
  id: string;
  student_id: string;
  test_type: string;
  score: number;
  detailed_results: Record<string, any>;
  completed_at: string;
  created_at: string;
  updated_at: string;
}

export interface SaveTestResultParams {
  studentId: string;
  testType: string;
  score: number;
  detailedResults: Record<string, any>;
}

function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export async function saveTestResult(params: SaveTestResultParams): Promise<TestResult> {
  console.log('Saving test result:', params);

  if (!isValidUUID(params.studentId)) {
    throw new Error('ID étudiant invalide');
  }
  
  const { data, error } = await supabase
    .from('test_results')
    .insert({
      student_id: params.studentId,
      test_type: params.testType,
      score: params.score,
      detailed_results: params.detailedResults,
      completed_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving test result:', error);
    throw error;
  }
  
  console.log('Test result saved successfully:', data);
  return data;
}

export async function getStudentTestResults(studentId: string): Promise<TestResult[]> {
  console.log('Fetching test results for student:', studentId);

  if (!isValidUUID(studentId)) {
    throw new Error('ID étudiant invalide');
  }
  
  const { data, error } = await supabase
    .from('test_results')
    .select('*')
    .eq('student_id', studentId)
    .order('completed_at', { ascending: false });

  if (error) {
    console.error('Error fetching test results:', error);
    throw error;
  }
  
  console.log('Test results fetched successfully:', data);
  return data || [];
}
