export interface QuizFormData {
  title: string;
  timeLimit: number;
}

export interface QuestionFormData {
  type: string;
  questionText: string;
  options?: string[];
  correctAnswer: any;
  points: number;
}

export interface ParticipantFormData {
  name: string;
  email: string;
  phone: string;
}

export interface QuizAnswer {
  questionId: number;
  answer: any;
  isCorrect: boolean;
  timeSpent: number;
}

export interface QRCodeData {
  quizId: number;
  title: string;
  url: string;
}
