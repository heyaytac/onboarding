import { NextRequest, NextResponse } from 'next/server';
import { answerQuestion, deleteQuestion } from '@/lib/storage';

// PATCH /api/questions/[id] - Answer a question
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { answer } = body;

    if (!answer || typeof answer !== 'string' || answer.trim() === '') {
      return NextResponse.json(
        { error: 'Answer text is required' },
        { status: 400 }
      );
    }

    const updatedQuestion = await answerQuestion(id, answer.trim());

    if (!updatedQuestion) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ question: updatedQuestion });
  } catch (error) {
    console.error('Error answering question:', error);
    return NextResponse.json(
      { error: 'Failed to answer question' },
      { status: 500 }
    );
  }
}

// DELETE /api/questions/[id] - Delete a question
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deleteQuestion(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { error: 'Failed to delete question' },
      { status: 500 }
    );
  }
}
