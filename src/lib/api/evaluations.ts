import { supabase } from '../supabase';
import type { Database } from '../types/database';

export interface EvaluationData {
  studentId: string;
  testType: string;
  score: number;
  detailedResults: Record<string, any>;
}

export async function saveEvaluation(data: EvaluationData) {
  console.log('Saving evaluation:', data);
  
  const { data: evaluation, error } = await supabase
    .from('evaluations')
    .insert({
      student_id: data.studentId,
      test_type: data.testType,
      score: data.score,
      detailed_results: data.detailedResults,
      date_completed: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving evaluation:', error);
    throw error;
  }
  
  console.log('Evaluation saved successfully:', evaluation);
  return evaluation;
}

export async function getStudentEvaluations(studentId: string) {
  const { data: evaluations, error } = await supabase
    .from('evaluations')
    .select('*')
    .eq('student_id', studentId)
    .order('date_completed', { ascending: false });

  if (error) throw error;
  return evaluations;
}

export async function getEvaluationById(id: string) {
  console.log('Fetching evaluation by ID:', id);
  
  const { data: evaluation, error } = await supabase
    .from('evaluations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching evaluation:', error);
    throw error;
  }

  if (!evaluation) {
    throw new Error('Évaluation non trouvée');
  }
  
  console.log('Evaluation fetched successfully:', evaluation);
  return evaluation;
}

export async function getEvaluationsByType(studentId: string, testType: string) {
  const { data: evaluations, error } = await supabase
    .from('evaluations')
    .select('*')
    .eq('student_id', studentId)
    .eq('test_type', testType)
    .order('date_completed', { ascending: false });

  if (error) throw error;
  return evaluations;
}

export async function getEvaluationsByDateRange(
  studentId: string,
  startDate: Date,
  endDate: Date
) {
  const { data: evaluations, error } = await supabase
    .from('evaluations')
    .select('*')
    .eq('student_id', studentId)
    .gte('date_completed', startDate.toISOString())
    .lte('date_completed', endDate.toISOString())
    .order('date_completed', { ascending: false });

  if (error) throw error;
  return evaluations;
}

export async function updateEvaluation(
  id: string,
  updates: Partial<Omit<EvaluationData, 'studentId'>>
) {
  const { data: evaluation, error } = await supabase
    .from('evaluations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return evaluation;
}

export async function deleteEvaluation(id: string) {
  const { error } = await supabase
    .from('evaluations')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
