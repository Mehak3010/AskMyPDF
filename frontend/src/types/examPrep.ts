export interface Definition {
  term: string
  meaning: string
}

export interface VivaQuestion {
  question: string
  answer: string
}

export interface ExamPrepData {
  important_topics: string[]
  long_questions: string[]
  short_questions: string[]
  definitions: Definition[]
  viva_questions: VivaQuestion[]
}