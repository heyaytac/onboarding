import { put, head } from '@vercel/blob';
import { Question, QuestionsData } from './types';

const BLOB_NAME = 'questions.json';

export async function getQuestions(): Promise<Question[]> {
  try {
    // Try to get the existing blob
    const blobUrl = `${process.env.BLOB_URL || ''}/${BLOB_NAME}`;
    const response = await fetch(blobUrl, { cache: 'no-store' });

    if (response.ok) {
      const data: QuestionsData = await response.json();
      return data.questions;
    }
  } catch (error) {
    console.log('No existing questions file, starting fresh');
  }

  return [];
}

export async function saveQuestions(questions: Question[]): Promise<void> {
  const data: QuestionsData = { questions };

  await put(BLOB_NAME, JSON.stringify(data, null, 2), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export async function addQuestion(questionText: string): Promise<Question> {
  const questions = await getQuestions();

  const newQuestion: Question = {
    id: generateId(),
    question: questionText,
    answer: null,
    createdAt: new Date().toISOString(),
    answeredAt: null,
  };

  questions.push(newQuestion);
  await saveQuestions(questions);

  return newQuestion;
}

export async function answerQuestion(id: string, answerText: string): Promise<Question | null> {
  const questions = await getQuestions();
  const questionIndex = questions.findIndex(q => q.id === id);

  if (questionIndex === -1) {
    return null;
  }

  questions[questionIndex] = {
    ...questions[questionIndex],
    answer: answerText,
    answeredAt: new Date().toISOString(),
  };

  await saveQuestions(questions);

  return questions[questionIndex];
}

export async function deleteQuestion(id: string): Promise<boolean> {
  const questions = await getQuestions();
  const filteredQuestions = questions.filter(q => q.id !== id);

  if (filteredQuestions.length === questions.length) {
    return false;
  }

  await saveQuestions(filteredQuestions);
  return true;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
