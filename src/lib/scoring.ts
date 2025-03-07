import { TestResponse } from './types/database';

export interface ScoreDistribution {
  jamais: number;
  parfois: number;
  souvent: number;
  tresSouvent: number;
}

export interface TestScores {
  testName: string;
  totalScore: number;
  maxScore: number;
  averageScore: number;
  level: 'Faible' | 'Moyen' | 'Bon' | 'Excellent';
  distribution: ScoreDistribution;
}

export function calculateTestScores(responses: TestResponse[], questionCount: number): TestScores {
  // Initialize distribution counters
  const distribution: ScoreDistribution = {
    jamais: 0,
    parfois: 0,
    souvent: 0,
    tresSouvent: 0
  };

  // Calculate total score and update distribution
  const totalScore = responses.reduce((sum, response) => {
    const score = response.answer_score;
    
    // Update distribution based on score ranges
    if (score <= 0.75) distribution.jamais++;
    else if (score <= 1.5) distribution.parfois++;
    else if (score <= 2.25) distribution.souvent++;
    else distribution.tresSouvent++;
    
    return sum + score;
  }, 0);

  const maxScore = questionCount * 3; // Maximum score is 3 per question
  const averageScore = Number((totalScore / questionCount).toFixed(2));
  const scorePercentage = (totalScore / maxScore) * 100;

  // Determine level based on score percentage
  let level: TestScores['level'];
  if (scorePercentage <= 50) {
    level = 'Faible';
  } else if (scorePercentage <= 70) {
    level = 'Moyen';
  } else if (scorePercentage <= 85) {
    level = 'Bon';
  } else {
    level = 'Excellent';
  }

  return {
    testName: '', // Will be set by the caller
    totalScore,
    maxScore,
    averageScore,
    level,
    distribution
  };
}

export function generateAnalysis(scores: TestScores[]): string {
  let analysis = '';

  // Global analysis
  const averageLevel = scores.reduce((sum, score) => {
    const levelScore = score.level === 'Excellent' ? 4 :
                      score.level === 'Bon' ? 3 :
                      score.level === 'Moyen' ? 2 : 1;
    return sum + levelScore;
  }, 0) / scores.length;

  analysis += 'Analyse globale : ';
  if (averageLevel >= 3.5) {
    analysis += 'Excellente maîtrise générale des compétences évaluées. ';
  } else if (averageLevel >= 2.5) {
    analysis += 'Bonne maîtrise avec quelques points d\'amélioration. ';
  } else if (averageLevel >= 1.5) {
    analysis += 'Niveau moyen nécessitant un renforcement ciblé. ';
  } else {
    analysis += 'Des difficultés importantes nécessitant un accompagnement spécifique. ';
  }

  // Analysis by domain
  scores.forEach(score => {
    analysis += `\n\n${score.testName} : `;
    
    if (score.level === 'Excellent') {
      analysis += 'Maîtrise exceptionnelle. ';
    } else if (score.level === 'Bon') {
      analysis += 'Bonne maîtrise. ';
    } else if (score.level === 'Moyen') {
      analysis += 'Niveau satisfaisant mais perfectible. ';
    } else {
      analysis += 'Des difficultés significatives. ';
    }

    // Distribution analysis
    const mostFrequent = Object.entries(score.distribution)
      .reduce((a, b) => a[1] > b[1] ? a : b)[0];
    
    analysis += `Tendance dominante : réponses "${mostFrequent}". `;
  });

  return analysis;
}

export function calculateProgress(
  currentScores: TestScores[],
  previousScores: TestScores[]
): number {
  if (!previousScores.length) return 0;

  const currentAverage = currentScores.reduce(
    (sum, score) => sum + (score.totalScore / score.maxScore),
    0
  ) / currentScores.length;

  const previousAverage = previousScores.reduce(
    (sum, score) => sum + (score.totalScore / score.maxScore),
    0
  ) / previousScores.length;

  return Number(((currentAverage - previousAverage) / previousAverage * 100).toFixed(2));
}
