import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { TestResult } from '@/lib/api/testResults';
import { formatDate } from '@/lib/utils';

// Register fonts with error handling
try {
  Font.register({
    family: 'Helvetica',
    fonts: [
      { src: 'https://fonts.cdnfonts.com/s/29719/Helvetica.woff', fontWeight: 'normal' },
      { src: 'https://fonts.cdnfonts.com/s/29719/Helvetica-Bold.woff', fontWeight: 'bold' }
    ]
  });
} catch (error) {
  console.warn('Font registration failed:', error);
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica'
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 10
  },
  title: {
    fontSize: 24,
    marginBottom: 8,
    fontFamily: 'Helvetica',
    fontWeight: 'bold',
    color: '#1e40af'
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica',
    fontWeight: 'bold',
    backgroundColor: '#f3f4f6',
    padding: 8,
    marginBottom: 10
  },
  infoBlock: {
    backgroundColor: '#f9fafb',
    padding: 12,
    marginBottom: 20,
    borderRadius: 4
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4
  },
  label: {
    width: '30%',
    fontSize: 12,
    color: '#666666'
  },
  value: {
    flex: 1,
    fontSize: 12,
    fontWeight: 'bold'
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  scoreLabel: {
    fontSize: 12,
    flex: 1
  },
  scoreValue: {
    fontSize: 12,
    fontWeight: 'bold'
  },
  recommendation: {
    flexDirection: 'row',
    marginBottom: 6
  },
  bullet: {
    width: 10,
    fontSize: 12
  },
  recommendationText: {
    flex: 1,
    fontSize: 12,
    paddingLeft: 4
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#666666',
    fontSize: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10
  },
  testResults: {
    marginTop: 20,
    marginBottom: 20,
  },
  testResult: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  testTitle: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  testScore: {
    fontSize: 12,
    color: '#1e40af',
  },
  testDetail: {
    fontSize: 10,
    color: '#666666',
    marginTop: 2,
  },
});

interface PDFReportProps {
  report: {
    testScores: Array<{
      title: string;
      totalScore: number;
      maxScore: number;
      average: number;
      level: string;
      distribution: {
        jamais: number;
        parfois: number;
        souvent: number;
        tresSouvent: number;
      };
    }>;
    overallScore: number;
    overallLevel: string;
    recommendations: string[];
    nextEvaluationDate: Date;
  };
  testResults: TestResult[];
  evaluatorName: string;
  subjectName: string;
  studentInfo: {
    age: number;
    class: string;
  };
  date: string;
  schoolInfo: {
    name: string;
  };
}

export function PDFReport({
  report,
  testResults,
  evaluatorName,
  subjectName,
  studentInfo,
  date,
  schoolInfo,
}: PDFReportProps) {
  // Validate required data
  if (!report || !subjectName || !date) {
    console.error('Missing required data for PDF generation');
    return null;
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Rapport d'Évaluation Cognitive</Text>
          <Text style={styles.subtitle}>Date : {formatDate(new Date(date))}</Text>
          <Text style={styles.subtitle}>{schoolInfo.name}</Text>
        </View>

        <View style={styles.infoBlock}>
          <View style={styles.row}>
            <Text style={styles.label}>Élève :</Text>
            <Text style={styles.value}>{subjectName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Âge :</Text>
            <Text style={styles.value}>{studentInfo.age} ans</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Classe :</Text>
            <Text style={styles.value}>{studentInfo.class}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Évaluateur :</Text>
            <Text style={styles.value}>{evaluatorName}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Score Global</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>Score global</Text>
            <Text style={styles.scoreValue}>{Math.round(report.overallScore)}%</Text>
          </View>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>Niveau général</Text>
            <Text style={styles.scoreValue}>{report.overallLevel}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Résultats par Domaine</Text>
          {report.testScores.map((score, index) => (
            <View key={index} style={styles.scoreRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.scoreLabel}>{score.title}</Text>
                <Text style={{ fontSize: 10, color: '#666666' }}>
                  Moyenne : {score.average.toFixed(1)}/3
                </Text>
              </View>
              <View>
                <Text style={styles.scoreValue}>
                  {score.totalScore}/{score.maxScore}
                </Text>
                <Text style={{ fontSize: 10, color: '#666666', textAlign: 'right' }}>
                  {score.level}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.testResults}>
          <Text style={styles.sectionTitle}>Historique des Tests</Text>
          {testResults.map((result, index) => (
            <View key={index} style={styles.testResult}>
              <View style={styles.testHeader}>
                <Text style={styles.testTitle}>{result.test_type}</Text>
                <Text style={styles.testScore}>{result.score}%</Text>
              </View>
              <Text style={styles.testDetail}>
                Date : {formatDate(new Date(result.completed_at))}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommandations</Text>
          {report.recommendations.map((recommendation, index) => (
            <View key={index} style={styles.recommendation}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.recommendationText}>{recommendation}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prochaine Évaluation</Text>
          <Text style={styles.recommendationText}>
            Recommandée le {formatDate(report.nextEvaluationDate)}
          </Text>
        </View>

        <Text style={styles.footer}>
          {schoolInfo.name} - Rapport généré le {formatDate(new Date())}
        </Text>
      </Page>
    </Document>
  );
}
