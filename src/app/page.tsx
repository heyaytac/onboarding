'use client';

import { useState, useEffect, useCallback } from 'react';
import { Question } from '@/lib/types';

type FilterType = 'all' | 'pending' | 'answered';
type SortType = 'newest' | 'oldest';

export default function Home() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [answerInputs, setAnswerInputs] = useState<Record<string, string>>({});
  const [editingAnswer, setEditingAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('newest');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchQuestions = useCallback(async () => {
    try {
      const res = await fetch('/api/questions');
      const data = await res.json();
      setQuestions(data.questions || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Fehler beim Laden der Fragen:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchQuestions, 30000);
    return () => clearInterval(interval);
  }, [fetchQuestions]);

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
        setEditingAnswer(null);
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

  function startEditAnswer(questionId: string, currentAnswer: string) {
    setEditingAnswer(questionId);
    setAnswerInputs({ ...answerInputs, [questionId]: currentAnswer });
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

  // Statistics
  const stats = {
    total: questions.length,
    answered: questions.filter(q => q.answer).length,
    pending: questions.filter(q => !q.answer).length,
  };

  // Filter and sort questions
  const filteredQuestions = questions
    .filter(q => {
      if (filter === 'pending') return !q.answer;
      if (filter === 'answered') return !!q.answer;
      return true;
    })
    .filter(q => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        q.question.toLowerCase().includes(query) ||
        (q.answer && q.answer.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sort === 'newest' ? dateB - dateA : dateA - dateB;
    });

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-black mb-2">
            Fragen & Antworten
          </h1>
          <p className="text-gray-500">
            Stellen Sie Ihre Fragen und erhalten Sie Antworten von unserem Team
          </p>
          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-2">
              Zuletzt aktualisiert: {formatDate(lastUpdated.toISOString())}
            </p>
          )}
        </header>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-black">{stats.total}</div>
            <div className="text-sm text-gray-500">Gesamt</div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-black">{stats.pending}</div>
            <div className="text-sm text-gray-500">Offen</div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-black">{stats.answered}</div>
            <div className="text-sm text-gray-500">Beantwortet</div>
          </div>
        </div>

        {/* Question Form */}
        <div className="border border-gray-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-black mb-4">
            Neue Frage stellen
          </h2>
          <form onSubmit={handleSubmitQuestion} className="flex flex-col gap-4">
            <div className="relative">
              <textarea
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Geben Sie Ihre Frage hier ein..."
                className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
                rows={3}
                maxLength={1000}
              />
              <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                {newQuestion.length}/1000
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting || !newQuestion.trim()}
              className="self-end px-6 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <LoadingSpinner />
                  Wird gesendet...
                </>
              ) : (
                'Frage absenden'
              )}
            </button>
          </form>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Fragen durchsuchen..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterType)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black bg-white"
            >
              <option value="all">Alle</option>
              <option value="pending">Offen</option>
              <option value="answered">Beantwortet</option>
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortType)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black bg-white"
            >
              <option value="newest">Neueste zuerst</option>
              <option value="oldest">Älteste zuerst</option>
            </select>
            <button
              onClick={fetchQuestions}
              className="px-3 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Aktualisieren"
            >
              <svg
                className="h-5 w-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Results info */}
        <div className="text-sm text-gray-500 mb-4">
          {filteredQuestions.length} von {questions.length} Fragen
          {searchQuery && ` für "${searchQuery}"`}
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <LoadingSpinner size="lg" />
              <p className="mt-4">Fragen werden geladen...</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <svg
                className="h-16 w-16 text-gray-300 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {questions.length === 0 ? (
                <>
                  <p className="text-lg font-medium text-gray-700">Noch keine Fragen</p>
                  <p className="text-sm">Stellen Sie die erste Frage!</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium text-gray-700">Keine Ergebnisse</p>
                  <p className="text-sm">Versuchen Sie andere Suchbegriffe oder Filter</p>
                </>
              )}
            </div>
          ) : (
            filteredQuestions.map((q) => (
              <div
                key={q.id}
                className="border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors"
              >
                {/* Question */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2.5 py-1 bg-black text-white text-xs font-semibold rounded">
                          Radhaus
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDate(q.createdAt)}
                        </span>
                        {!q.answer && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                            Offen
                          </span>
                        )}
                      </div>
                      <p className="text-black whitespace-pre-wrap leading-relaxed">
                        {q.question}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors p-1"
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

                {/* Answer */}
                {q.answer && editingAnswer !== q.id ? (
                  <div className="p-5 bg-gray-50 border-t border-gray-100">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2.5 py-1 bg-white text-black text-xs font-semibold rounded border border-black">
                            Voisa
                          </span>
                          <span className="text-xs text-gray-400">
                            {q.answeredAt && formatDate(q.answeredAt)}
                          </span>
                        </div>
                        <p className="text-black whitespace-pre-wrap leading-relaxed">
                          {q.answer}
                        </p>
                      </div>
                      <button
                        onClick={() => startEditAnswer(q.id, q.answer!)}
                        className="text-gray-300 hover:text-black transition-colors p-1"
                        title="Antwort bearbeiten"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 bg-gray-50 border-t border-gray-100">
                    {!q.answer && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-0.5 bg-gray-200 text-gray-500 text-xs rounded">
                          Wartet auf Antwort
                        </span>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <div className="flex-1 relative">
                        <textarea
                          value={answerInputs[q.id] || ''}
                          onChange={(e) =>
                            setAnswerInputs({
                              ...answerInputs,
                              [q.id]: e.target.value,
                            })
                          }
                          placeholder="Geben Sie Ihre Antwort hier ein..."
                          className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
                          rows={2}
                          maxLength={2000}
                        />
                        <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                          {(answerInputs[q.id] || '').length}/2000
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleSubmitAnswer(q.id)}
                          disabled={!answerInputs[q.id]?.trim()}
                          className="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {editingAnswer === q.id ? 'Speichern' : 'Antworten'}
                        </button>
                        {editingAnswer === q.id && (
                          <button
                            onClick={() => {
                              setEditingAnswer(null);
                              setAnswerInputs({ ...answerInputs, [q.id]: '' });
                            }}
                            className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                          >
                            Abbrechen
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingSpinner({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  const sizeClasses = size === 'lg' ? 'h-8 w-8' : 'h-4 w-4';
  return (
    <svg
      className={`animate-spin ${sizeClasses} text-current`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
