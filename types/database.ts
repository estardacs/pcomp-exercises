export type SubmissionStatus = 'unassigned' | 'pending' | 'in_progress' | 'done'

export interface Profile {
  id: string
  name: string
  role: 'profesor' | 'ayudante' | 'alumno'
  rut: string | null
  created_at: string
}

export interface RutMap {
  [digit: string]: string
}

export interface RubricQuestion {
  n: number
  title: string
  max_points: number
  criteria: string
  ideal_code?: string
  rut_indexed: boolean
  rut_map?: RutMap
  expected_template?: string
}

export interface ExerciseRubric {
  title: string
  module: string
  total_points: number
  questions: RubricQuestion[]
}

export interface Exercise {
  id: string
  title: string
  module: string
  total_points: number
  is_optional: boolean
  rubrica: ExerciseRubric
  due_date: string | null
  created_at: string
}

export interface CellOutput {
  kind: 'text' | 'image' | 'error'
  text?: string    // stdout/stderr/result text
  image?: string   // base64 PNG (matplotlib plots, etc.)
}

export interface ParsedCell {
  type: 'code' | 'markdown'
  source: string
  is_placeholder: boolean
  outputs?: CellOutput[]
}

export interface ParsedQuestion {
  n: number
  title: string
  max_points: number
  cells: ParsedCell[]
  is_empty: boolean
}

export interface NotebookJson {
  questions: ParsedQuestion[]
  raw_cells?: ParsedCell[]
}

export interface Submission {
  id: string
  exercise_id: string
  student_apellido: string
  student_nombre: string
  student_rut: string
  rut_last_digit: string
  filename: string
  notebook_storage_path: string | null
  notebook_json: NotebookJson
  uploaded_at: string
  uploaded_by: string | null
  assigned_to: string | null
  status: SubmissionStatus
  total_score: number | null
  general_comment: string | null
  graded_at: string | null
  nota_synced_at: string | null
}

export interface QuestionGrade {
  id: string
  submission_id: string
  question_n: number
  question_title: string | null
  max_points: number
  score: number | null
  comment: string | null
  is_empty: boolean
  graded_by: string | null
  graded_at: string
}

export interface SubmissionWithGrades extends Submission {
  grades: QuestionGrade[]
  exercise?: Exercise
  assignee?: Profile
}

// Full Supabase-compatible Database type
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id'>>
      }
      exercises: {
        Row: Exercise
        Insert: Omit<Exercise, 'created_at'>
        Update: Partial<Omit<Exercise, 'id'>>
      }
      submissions: {
        Row: Submission
        Insert: Omit<Submission, 'id' | 'uploaded_at'>
        Update: Partial<Omit<Submission, 'id'>>
      }
      question_grades: {
        Row: QuestionGrade
        Insert: Omit<QuestionGrade, 'id' | 'graded_at'>
        Update: Partial<Omit<QuestionGrade, 'id'>>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
