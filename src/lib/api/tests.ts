import { supabase } from '../supabase';
import type { Database } from '../types/database';
import { TestScores, calculateTestScores } from '../scoring';

export async function getTestResults(sessionId: string): Promise<TestScores[]> {
  const { data: responses, error } = await supabase
    .from('test_responses')
    .select(`
      *,
      questions (
        id,
        category,
        question
      )
    `)
    .eq('session_id', sessionId);

  if (error) throw error;

  // Group responses by test category
  const responsesByCategory = responses.reduce((acc, response) => {
    const category = response.questions.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(response);
    return acc;
  }, {} as Record<string, typeof responses>);

  // Calculate scores for each category
  const scores = await Promise.all(
    Object.entries(responsesByCategory).map(async ([category, categoryResponses]) => {
      const scores = await calculateTestScores(categoryResponses, categoryResponses.length);
      scores.testName = category;
      return scores;
    })
  );

  return scores;
}

export async function getStudentTestHistory(studentId: string): Promise<{
  sessions: any[];
  scores: TestScores[];
}> {
  const { data: sessions, error } = await supabase
    .from('test_sessions')
    .select(`
      *,
      test_responses (
        *,
        questions (
          id,
          category,
          question
        )
      )
    `)
    .eq('student_id', studentId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const scores = await Promise.all(
    sessions.map(async (session) => {
      return await getTestResults(session.id);
    })
  );

  return {
    sessions,
    scores: scores.flat(),
  };
}
