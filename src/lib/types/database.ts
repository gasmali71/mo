export interface Student {
  id: string;
  user_id: string;
  full_name: string;
  date_of_birth: string;
  grade_level: string;
  created_at: string;
  updated_at: string;
}

export interface Guardian {
  id: string;
  student_id: string;
  full_name: string;
  relationship: string;
  email?: string;
  phone?: string;
  created_at: string;
}

export interface TestSession {
  id: string;
  student_id: string;
  evaluator_id: string;
  start_time: string;
  end_time?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
}

export interface TestResponse {
  id: string;
  session_id: string;
  question_id: string;
  answer_score: number;
  response_time: string;
  created_at: string;
}

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

export interface Database {
  public: {
    Tables: {
      students: {
        Row: Student;
        Insert: Omit<Student, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Student, 'id' | 'created_at' | 'updated_at'>>;
      };
      guardians: {
        Row: Guardian;
        Insert: Omit<Guardian, 'id' | 'created_at'>;
        Update: Partial<Omit<Guardian, 'id' | 'created_at'>>;
      };
      test_sessions: {
        Row: TestSession;
        Insert: Omit<TestSession, 'id' | 'created_at'>;
        Update: Partial<Omit<TestSession, 'id' | 'created_at'>>;
      };
      test_responses: {
        Row: TestResponse;
        Insert: Omit<TestResponse, 'id' | 'created_at'>;
        Update: Partial<Omit<TestResponse, 'id' | 'created_at'>>;
      };
      test_results: {
        Row: TestResult;
        Insert: Omit<TestResult, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<TestResult, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}
