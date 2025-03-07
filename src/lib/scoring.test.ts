import { describe, test, expect } from 'vitest';
import { calculateResults, generateAnalysis, calculateProgress } from './scoring';

describe('Scoring System', () => {
  describe('calculateResults', () => {
    test('calculates correct scores and levels', () => {
      const answers = {
        'q1': 3,
        'q2': 2,
        'q3': 1,
        'q4': 0
      };

      const result = calculateResults(answers);

      expect(result.totalScore).toBe(6);
      expect(result.maxScore).toBe(12);
      expect(result.averageScore).toBe(1.5);
      expect(result.distribution).toEqual({
        jamais: 1,
        parfois: 1,
        souvent: 1,
        tresSouvent: 1
      });
    });

    test('determines correct levels based on score percentage', () => {
      const lowScores = { 'q1': 0, 'q2': 1 }; // 1/6 = 16.67%
      const mediumScores = { 'q1': 2, 'q2': 1 }; // 3/6 = 50%
      const goodScores = { 'q1': 2, 'q2': 3 }; // 5/6 = 83.33%
      const excellentScores = { 'q1': 3, 'q2': 3 }; // 6/6 = 100%

      expect(calculateResults(lowScores).level).toBe('Faible');
      expect(calculateResults(mediumScores).level).toBe('Moyen');
      expect(calculateResults(goodScores).level).toBe('Bon');
      expect(calculateResults(excellentScores).level).toBe('Excellent');
    });
  });

  describe('generateAnalysis', () => {
    test('generates appropriate analysis based on scores', () => {
      const scores = [
        {
          testName: 'Test 1',
          totalScore: 10,
          maxScore: 12,
          averageScore: 2.5,
          level: 'Bon' as const,
          distribution: {
            jamais: 0,
            parfois: 1,
            souvent: 2,
            tresSouvent: 1
          }
        }
      ];

      const analysis = generateAnalysis(scores);
      
      expect(analysis).toContain('Bonne maîtrise');
      expect(analysis).toContain('Test 1');
    });
  });

  describe('calculateProgress', () => {
    test('calculates correct progress percentage', () => {
      const previousScores = [{
        totalScore: 6,
        maxScore: 12,
        averageScore: 1.5,
        level: 'Moyen' as const,
        testName: 'Test',
        distribution: {
          jamais: 1,
          parfois: 1,
          souvent: 1,
          tresSouvent: 1
        }
      }];

      const currentScores = [{
        totalScore: 9,
        maxScore: 12,
        averageScore: 2.25,
        level: 'Bon' as const,
        testName: 'Test',
        distribution: {
          jamais: 0,
          parfois: 1,
          souvent: 1,
          tresSouvent: 2
        }
      }];

      const progress = calculateProgress(currentScores, previousScores);
      expect(progress).toBe(50); // (0.75 - 0.5) / 0.5 * 100 = 50%
    });

    test('returns 0 when no previous scores', () => {
      const currentScores = [{
        totalScore: 9,
        maxScore: 12,
        averageScore: 2.25,
        level: 'Bon' as const,
        testName: 'Test',
        distribution: {
          jamais: 0,
          parfois: 1,
          souvent: 1,
          tresSouvent: 2
        }
      }];

      const progress = calculateProgress(currentScores, []);
      expect(progress).toBe(0);
    });
  });
});
