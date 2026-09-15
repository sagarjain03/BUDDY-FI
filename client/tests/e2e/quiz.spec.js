import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { API_URL, registerViaApi, signIn } from './helpers';

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../server');
const auth = (token) => ({ Authorization: `Bearer ${token}` });

/** Runs a tiny script inside the server package, against the test database. */
const onServer = (source) =>
  execFileSync('node', ['-e', source], {
    cwd: serverDir,
    encoding: 'utf8',
    env: { ...process.env, MONGO_DB_NAME: process.env.SMOKE_DB_NAME || 'buddyfi_test' },
  });

const questionsOf = async (request, token) => {
  const response = await request.get(`${API_URL}/api/questions`, { headers: auth(token) });
  return (await response.json()).data.questions;
};

test.describe('the quiz lives in the database', () => {
  test('questions are served from the database, in order', async ({ request }) => {
    const me = await registerViaApi(request);
    const questions = await questionsOf(request, me.token);

    expect(questions.length).toBeGreaterThanOrEqual(7);
    expect(questions[0].prompt).toBeTruthy();
    expect(questions[0].options.length).toBeGreaterThanOrEqual(2);
    // Options carry a stable value plus a display label, not just a string.
    expect(questions[0].options[0]).toHaveProperty('value');
    expect(questions[0].options[0]).toHaveProperty('label');
  });

  test('answers are stored against question ids and read back with labels', async ({
    request,
  }) => {
    const me = await registerViaApi(request);
    const questions = await questionsOf(request, me.token);

    const submitted = await request.post(`${API_URL}/api/auth/answers`, {
      headers: auth(me.token),
      data: {
        answers: questions.map((question) => ({
          questionId: question._id,
          value: question.options[0].value,
        })),
      },
    });
    expect(submitted.status()).toBe(200);

    const mine = await request.get(`${API_URL}/api/auth/answers`, { headers: auth(me.token) });
    const body = await mine.json();

    expect(body.data.answers).toHaveLength(questions.length);
    expect(body.data.answers[0].answerLabel).toBe(questions[0].options[0].label);
  });

  test('an answer that is not one of the options is refused', async ({ request }) => {
    const me = await registerViaApi(request);
    const questions = await questionsOf(request, me.token);

    const bogusValue = await request.post(`${API_URL}/api/auth/answers`, {
      headers: auth(me.token),
      data: { answers: [{ questionId: questions[0]._id, value: 'not-an-option' }] },
    });
    expect(bogusValue.status()).toBe(400);

    const bogusQuestion = await request.post(`${API_URL}/api/auth/answers`, {
      headers: auth(me.token),
      data: { answers: [{ questionId: '507f1f77bcf86cd799439011', value: 'anything' }] },
    });
    expect(bogusQuestion.status()).toBe(400);
  });

  test('a partial submission keeps the answers already given', async ({ request }) => {
    const me = await registerViaApi(request);
    const questions = await questionsOf(request, me.token);

    await request.post(`${API_URL}/api/auth/answers`, {
      headers: auth(me.token),
      data: {
        answers: questions
          .slice(0, 3)
          .map((question) => ({ questionId: question._id, value: question.options[0].value })),
      },
    });

    // A second, separate submission must add rather than replace.
    await request.post(`${API_URL}/api/auth/answers`, {
      headers: auth(me.token),
      data: {
        answers: [{ questionId: questions[3]._id, value: questions[3].options[1].value }],
      },
    });

    const mine = await request.get(`${API_URL}/api/auth/answers`, { headers: auth(me.token) });
    expect((await mine.json()).data.answers).toHaveLength(4);
  });
});

test.describe('adding a question needs no deploy', () => {
  const KEY = 'e2e-extra-question';

  test.afterAll(() => {
    onServer(`
      require('dotenv').config();
      const mongoose = require('mongoose');
      (async () => {
        await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.MONGO_DB_NAME });
        await mongoose.connection.db.collection('questions').deleteMany({ key: '${KEY}' });
        await mongoose.disconnect();
      })();
    `);
  });

  test('a question added to the database shows up in the quiz', async ({ page, request }) => {
    // Added straight to the database — no code change, no rebuild.
    onServer(`
      require('dotenv').config();
      const mongoose = require('mongoose');
      (async () => {
        await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.MONGO_DB_NAME });
        await mongoose.connection.db.collection('questions').updateOne(
          { key: '${KEY}' },
          { $set: {
            key: '${KEY}',
            prompt: 'Which sounds more like a good evening?',
            label: 'Evenings',
            order: 99,
            isActive: true,
            options: [
              { value: 'quiet-night', label: 'A quiet night in', group: 'e2e-a' },
              { value: 'loud-night', label: 'Somewhere loud', group: 'e2e-b' },
            ],
          } },
          { upsert: true }
        );
        await mongoose.disconnect();
      })();
    `);

    // The cache holds questions for a minute, so give it a beat.
    await expect
      .poll(
        async () => {
          const me = await registerViaApi(request);
          const questions = await questionsOf(request, me.token);
          return questions.some((question) => question.key === KEY);
        },
        { timeout: 20_000, intervals: [500, 1000, 2000] }
      )
      .toBe(true);

    const me = await registerViaApi(request, { name: 'Extra Question Taker' });
    await signIn(page, me.token);
    await page.goto('/submit-answer');

    // The new question is simply part of the quiz.
    await expect(page.getByText(/of 8$/)).toBeVisible();

    const questions = await questionsOf(request, me.token);
    const added = questions.find((question) => question.key === KEY);
    expect(added.options.map((option) => option.label)).toEqual([
      'A quiet night in',
      'Somewhere loud',
    ]);
  });
});
