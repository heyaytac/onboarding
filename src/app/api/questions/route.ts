import { NextRequest, NextResponse } from 'next/server';
import { getQuestions, addQuestion } from '@/lib/storage';

// GET /api/questions - Get all questions
export async function GET() {
  try {
    const questions = await getQuestions();
    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

// POST /api/questions - Add a new question
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question } = body;

    if (!question || typeof question !== 'string' || question.trim() === '') {
      return NextResponse.json(
        { error: 'Question text is required' },
        { status: 400 }
      );
    }

    const newQuestion = await addQuestion(question.trim());
    return NextResponse.json({ question: newQuestion }, { status: 201 });
  } catch (error) {
    console.error('Error adding question:', error);
    return NextResponse.json(
      { error: 'Failed to add question' },
      { status: 500 }
    );
  }
}
