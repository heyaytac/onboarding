'use client';

import { useState, useEffect } from 'react';
import { Question } from '@/lib/types';

export default function Home() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [answerInputs, setAnswerInputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  async function fetchQuestions() {
    try {
      const res = await fetch('/api/questions');
      const data = await res.json();
      setQuestions(data.questions || []);
    } catch (error) {
      console.error('Fehler beim Laden der Fragen:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!newQuestion.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: newQuestion }),
      });

      if (res.ok) {
        setNewQuestion('');
        fetchQuestions();
      }
    } catch (error) {
      console.error('Fehler beim Absenden der Frage:', error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitAnswer(questionId: string) {
    const answer = answerInputs[questionId];
    if (!answer?.trim()) return;

    try {
      const res = await fetch(`/api/questions/${questionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer }),
      });

      if (res.ok) {
        setAnswerInputs({ ...answerInputs, [questionId]: '' });
        fetchQuestions();
      }
    } catch (error) {
      console.error('Fehler beim Absenden der Antwort:', error);
    }
  }

  async function handleDeleteQuestion(questionId: string) {
    if (!confirm('Sind Sie sicher, dass Sie diese Frage löschen möchten?')) return;

    try {
      const res = await fetch(`/api/questions/${questionId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchQuestions();
      }
    } catch (error) {
      console.error('Fehler beim Löschen der Frage:', error);
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-black mb-2">
            Fragen & Antworten
          </h1>
          <p className="text-gray-600">
            Stellen Sie Ihre Fragen und erhalten Sie Antworten von unserem Team
          </p>
        </header>

        {/* Frage-Formular */}
        <div className="border border-gray-300 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-black mb-4">
            Frage stellen
          </h2>
          <form onSubmit={handleSubmitQuestion} className="flex flex-col gap-4">
            <textarea
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Geben Sie Ihre Frage hier ein..."
              className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
              rows={3}
            />
            <button
              type="submit"
              disabled={submitting || !newQuestion.trim()}
              className="self-end px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Wird gesendet...' : 'Frage absenden'}
            </button>
          </form>
        </div>

        {/* Fragen-Liste */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-black">
            Fragen ({questions.length})
          </h2>

          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Fragen werden geladen...
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Noch keine Fragen vorhanden. Stellen Sie die erste Frage!
            </div>
          ) : (
            <div className="space-y-4">
              {questions
                .slice()
                .reverse()
                .map((q) => (
                  <div
                    key={q.id}
                    className="border border-gray-300 rounded-lg overflow-hidden"
                  >
                    {/* Frage */}
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 bg-black text-white text-xs font-semibold rounded">
                              Radhaus
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(q.createdAt)}
                            </span>
                          </div>
                          <p className="text-black whitespace-pre-wrap">
                            {q.question}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="text-gray-400 hover:text-black transition-colors"
                          title="Frage löschen"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Antwort */}
                    {q.answer ? (
                      <div className="p-6 bg-gray-50">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-white text-black text-xs font-semibold rounded border border-black">
                            Voisa
                          </span>
                          <span className="text-xs text-gray-500">
                            {q.answeredAt && formatDate(q.answeredAt)}
                          </span>
                        </div>
                        <p className="text-black whitespace-pre-wrap">
                          {q.answer}
                        </p>
                      </div>
                    ) : (
                      <div className="p-6 bg-gray-50">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs font-semibold rounded">
                            Wartet auf Antwort
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <textarea
                            value={answerInputs[q.id] || ''}
                            onChange={(e) =>
                              setAnswerInputs({
                                ...answerInputs,
                                [q.id]: e.target.value,
                              })
                            }
                            placeholder="Geben Sie Ihre Antwort hier ein..."
                            className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
                            rows={2}
                          />
                          <button
                            onClick={() => handleSubmitAnswer(q.id)}
                            disabled={!answerInputs[q.id]?.trim()}
                            className="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-end"
                          >
                            Antworten
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
