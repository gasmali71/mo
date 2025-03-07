import { TestResponse } from './types/database';
import { getTestResults, getStudentTestHistory } from './api/tests';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface Answer {
  score: number;
  notes: string;
}

export interface TestScore {
  title: string;
  totalScore: number;
  maxScore: number;
  average: number;
  level: 'Faible' | 'Moyen' | 'Élevé';
  distribution: {
    jamais: number;
    parfois: number;
    souvent: number;
    tresSouvent: number;
  };
}

export interface AnalysisReport {
  testScores: TestScore[];
  overallScore: number;
  overallLevel: string;
  recommendations: string[];
  nextEvaluationDate: Date;
}

export async function analyzeTestResponses(sessionId: string): Promise<AnalysisReport> {
  const scores = await getTestResults(sessionId);
  
  // Calculate overall score (average of all test percentages)
  const overallScore = scores.reduce((acc, score) => {
    return acc + (score.totalScore / score.maxScore) * 100;
  }, 0) / scores.length;

  // Determine overall level
  let overallLevel: string;
  if (overallScore < 33) {
    overallLevel = 'Difficultés importantes';
  } else if (overallScore < 66) {
    overallLevel = 'Niveau moyen avec axes d\'amélioration';
  } else {
    overallLevel = 'Bonne maîtrise générale';
  }

  // Generate recommendations based on scores
  const recommendations = generateRecommendations(scores);

  // Set next evaluation date (3 months from now)
  const nextEvaluationDate = new Date();
  nextEvaluationDate.setMonth(nextEvaluationDate.getMonth() + 3);

  return {
    testScores: scores.map(score => ({
      title: score.testName,
      totalScore: score.totalScore,
      maxScore: score.maxScore,
      average: score.averageScore,
      level: score.level,
      distribution: score.distribution
    })),
    overallScore,
    overallLevel,
    recommendations,
    nextEvaluationDate
  };
}

export async function getStudentProgress(studentId: string): Promise<{
  history: AnalysisReport[];
  progressPercentage: number;
}> {
  const { scores } = await getStudentTestHistory(studentId);
  
  // Group scores by test session
  const sessionScores = scores.reduce((acc, score) => {
    const sessionId = score.sessionId;
    if (!acc[sessionId]) {
      acc[sessionId] = [];
    }
    acc[sessionId].push(score);
    return acc;
  }, {} as Record<string, typeof scores>);

  // Generate reports for each session
  const reports = await Promise.all(
    Object.values(sessionScores).map(async (sessionScores) => {
      const overallScore = sessionScores.reduce((acc, score) => {
        return acc + (score.totalScore / score.maxScore) * 100;
      }, 0) / sessionScores.length;

      let overallLevel: string;
      if (overallScore < 33) {
        overallLevel = 'Difficultés importantes';
      } else if (overallScore < 66) {
        overallLevel = 'Niveau moyen avec axes d\'amélioration';
      } else {
        overallLevel = 'Bonne maîtrise générale';
      }

      const nextEvaluationDate = new Date();
      nextEvaluationDate.setMonth(nextEvaluationDate.getMonth() + 3);

      return {
        testScores: sessionScores.map(score => ({
          title: score.testName,
          totalScore: score.totalScore,
          maxScore: score.maxScore,
          average: score.averageScore,
          level: score.level,
          distribution: score.distribution
        })),
        overallScore,
        overallLevel,
        recommendations: generateRecommendations(sessionScores),
        nextEvaluationDate
      };
    })
  );

  // Calculate progress percentage
  const progressPercentage = reports.length > 1
    ? ((reports[0].overallScore - reports[1].overallScore) / reports[1].overallScore) * 100
    : 0;

  return {
    history: reports,
    progressPercentage
  };
}

function generateRecommendations(scores: TestScore[]): string[] {
  const recommendations: string[] = [];

  scores.forEach(score => {
    if (score.level === 'Faible') {
      switch (score.title) {
        case 'Inhibition':
          recommendations.push(
            'Pratiquer des exercices de concentration et de contrôle des impulsions',
            'Établir des routines claires pour les moments de travail'
          );
          break;
        case 'Flexibilité cognitive':
          recommendations.push(
            'Encourager l\'exploration de nouvelles méthodes de travail',
            'Proposer des activités variées nécessitant des changements de stratégie'
          );
          break;
        case 'Contrôle émotionnel':
          recommendations.push(
            'Mettre en place des techniques de gestion des émotions',
            'Pratiquer des exercices de respiration et de relaxation'
          );
          break;
        case 'Auto-régulation':
          recommendations.push(
            'Développer des stratégies d\'auto-observation',
            'Utiliser des outils de suivi du comportement'
          );
          break;
        case 'Mémoire de travail':
          recommendations.push(
            'Utiliser des supports visuels et mnémotechniques',
            'Fractionner les informations en petites unités'
          );
          break;
        case 'Planification et organisation':
          recommendations.push(
            'Mettre en place un système de planification quotidien',
            'Utiliser des check-lists et des rappels visuels'
          );
          break;
      }
    }
  });

  if (recommendations.length === 0) {
    recommendations.push(
      'Continuer à maintenir les bonnes pratiques actuelles',
      'Pratiquer régulièrement des exercices de renforcement'
    );
  }

  return recommendations;
}

export function formatDate(date: Date): string {
  return format(date, 'dd MMMM yyyy', { locale: fr });
}
