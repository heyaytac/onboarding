export interface Question {
  id: string;
  question: string;
  answer: string | null;
  createdAt: string;
  answeredAt: string | null;
}

export interface QuestionsData {
  questions: Question[];
}
