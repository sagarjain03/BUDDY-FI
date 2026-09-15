import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import { apiFetch } from '../../lib/api';
import { optionImage } from '../../lib/quizImages';

const QuestionPage = () => {
  const navigate = useNavigate();

  const [questions, setQuestions] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    Promise.all([apiFetch('/api/questions'), apiFetch('/api/auth/answers').catch(() => null)])
      .then(([list, mine]) => {
        if (cancelled) return;
        setQuestions(list.data.questions);

        // Pre-fill what they already answered, so retaking the quiz or
        // answering newly added questions does not start from scratch.
        if (mine?.data?.answers) {
          setSelected(
            Object.fromEntries(
              mine.data.answers.map((answer) => [String(answer.questionId), answer.value])
            )
          );
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load the quiz');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error && !questions) {
    return (
      <div className="card p-7">
        <Alert tone="error">{error}</Alert>
      </div>
    );
  }

  if (!questions) {
    return (
      <div className="card space-y-4 p-7">
        <div className="skeleton h-3 w-full rounded-full" />
        <div className="skeleton h-6 w-2/3 rounded" />
        <div className="grid grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((key) => (
            <div key={key} className="skeleton aspect-[4/3] w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const question = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const answered = questions.filter((entry) => selected[String(entry._id)]).length;
  const progress = Math.round((answered / questions.length) * 100);
  const chosen = selected[String(question._id)];

  const choose = (value) =>
    setSelected((current) => ({ ...current, [String(question._id)]: value }));

  const submit = async () => {
    const missing = questions.findIndex((entry) => !selected[String(entry._id)]);
    if (missing !== -1) {
      setCurrentIndex(missing);
      setError('Please answer every question before submitting.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await apiFetch('/api/auth/answers', {
        method: 'POST',
        body: {
          answers: questions.map((entry) => ({
            questionId: entry._id,
            value: selected[String(entry._id)],
          })),
        },
      });
      navigate('/welcome', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to submit answers.');
      setSubmitting(false);
    }
  };

  return (
    <div className="card w-full overflow-hidden">
      {/* Progress -------------------------------------------------------- */}
      <div className="border-b border-ink-100 px-6 py-5 sm:px-8">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-ink-900">
            Question {currentIndex + 1}
            <span className="font-normal text-ink-400"> of {questions.length}</span>
          </span>
          <span className="font-medium text-ink-500">{progress}% complete</span>
        </div>
        <div
          className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink-100"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-brand-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question -------------------------------------------------------- */}
      <div className="px-6 py-8 sm:px-8">
        <h2 className="text-xl font-extrabold sm:text-2xl">{question.prompt}</h2>
        <p className="mt-2 text-sm text-ink-500">
          {question.helpText || 'Pick the one that fits you best — there is no wrong answer.'}
        </p>

        {error && (
          <Alert tone="error" className="mt-5">
            {error}
          </Alert>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
          {question.options.map((option) => {
            const isChosen = chosen === option.value;
            const image = option.imageUrl || optionImage(option.label);

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => choose(option.value)}
                aria-pressed={isChosen}
                className={`group overflow-hidden rounded-2xl border-2 text-left transition-all duration-200 ${
                  isChosen
                    ? 'border-brand-500 shadow-glow'
                    : 'border-ink-100 hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-soft'
                }`}
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink-100">
                  {image && (
                    <img
                      src={image}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  )}
                  {isChosen && (
                    <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
                      &#10003;
                    </span>
                  )}
                </div>
                <span
                  className={`flex min-h-[3.25rem] items-center px-3 py-2.5 text-sm font-semibold ${
                    isChosen ? 'text-brand-700' : 'text-ink-700'
                  }`}
                >
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Controls -------------------------------------------------------- */}
      <div className="flex items-center justify-between gap-3 border-t border-ink-100 bg-ink-50 px-6 py-4 sm:px-8">
        <Button
          variant="outline"
          onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
          disabled={currentIndex === 0}
        >
          Back
        </Button>

        <div className="flex items-center gap-1.5">
          {questions.map((entry, index) => (
            <span
              key={entry._id}
              className={`h-1.5 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-5 bg-brand-500'
                  : selected[String(entry._id)]
                    ? 'w-1.5 bg-brand-300'
                    : 'w-1.5 bg-ink-200'
              }`}
            />
          ))}
        </div>

        {isLast ? (
          <Button onClick={submit} disabled={!chosen || submitting}>
            {submitting ? 'Saving…' : 'Finish'}
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentIndex((index) => Math.min(questions.length - 1, index + 1))}
            disabled={!chosen}
          >
            Next
          </Button>
        )}
      </div>
    </div>
  );
};

export default QuestionPage;
