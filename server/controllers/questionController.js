const { getQuestions } = require('../services/questionService');

/** GET /api/questions — the active quiz, in order. */
exports.list = async (req, res) => {
  try {
    const questions = await getQuestions();

    res.status(200).json({
      status: 'success',
      results: questions.length,
      data: {
        questions: questions.map((question) => ({
          _id: question._id,
          key: question.key,
          prompt: question.prompt,
          label: question.label,
          helpText: question.helpText,
          options: question.options.map((option) => ({
            value: option.value,
            label: option.label,
            imageUrl: option.imageUrl,
          })),
        })),
      },
    });
  } catch (err) {
    console.error('list questions failed:', err);
    res.status(500).json({ status: 'error', message: 'Something went wrong. Please try again.' });
  }
};

/**
 * POST /api/auth/answers  { answers: [{ questionId, value }] }
 *
 * Partial submissions are fine, so a member can answer newly added questions
 * later without redoing the whole quiz.
 */
exports.submit = async (req, res) => {
  try {
    const submitted = Array.isArray(req.body.answers) ? req.body.answers : null;
    if (!submitted) {
      return res.status(400).json({ status: 'error', message: 'answers must be an array' });
    }

    const questions = await getQuestions();
    const byId = new Map(questions.map((question) => [String(question._id), question]));

    // Keep whatever they answered before, so this can be a partial update.
    const merged = new Map(
      (req.user.answers || []).map((answer) => [String(answer.question), answer])
    );

    for (const entry of submitted) {
      const question = byId.get(String(entry?.questionId));
      if (!question) {
        return res.status(400).json({ status: 'error', message: 'Unknown question' });
      }

      const option = question.options.find((candidate) => candidate.value === entry.value);
      if (!option) {
        // Otherwise a member could store arbitrary strings and skew matching.
        return res.status(400).json({
          status: 'error',
          message: `"${entry.value}" is not an option for that question`,
        });
      }

      merged.set(String(question._id), {
        question: question._id,
        value: option.value,
        answeredAt: new Date(),
      });
    }

    req.user.answers = [...merged.values()];
    await req.user.save({ validateModifiedOnly: true });

    res.status(200).json({
      status: 'success',
      message: 'Answers saved',
      data: { answered: req.user.answers.length, total: questions.length },
    });
  } catch (err) {
    console.error('submit answers failed:', err);
    res.status(500).json({ status: 'error', message: 'Something went wrong. Please try again.' });
  }
};

/** GET /api/auth/answers — the caller's own answers. */
exports.mine = async (req, res) => {
  try {
    const questions = await getQuestions();
    const byId = new Map(questions.map((question) => [String(question._id), question]));

    const answers = (req.user.answers || [])
      .map((answer) => {
        const question = byId.get(String(answer.question));
        if (!question) return null;
        const option = question.options.find((candidate) => candidate.value === answer.value);

        return {
          questionId: question._id,
          key: question.key,
          label: question.label,
          prompt: question.prompt,
          value: answer.value,
          answerLabel: option?.label || answer.value,
        };
      })
      .filter(Boolean);

    res.status(200).json({
      status: 'success',
      data: { answers, total: questions.length },
    });
  } catch (err) {
    console.error('list answers failed:', err);
    res.status(500).json({ status: 'error', message: 'Something went wrong. Please try again.' });
  }
};
