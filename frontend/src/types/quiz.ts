export interface QuizQuestion {
  question: string
  topic?: string
  options: string[]
  answer: string
  explanation: string
}

export interface QuizData {
  questions: QuizQuestion[]
}