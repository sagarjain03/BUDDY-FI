export const API_URL = process.env.VITE_API_URL || 'http://localhost:5000';

// Every account this suite creates uses this prefix so cleanup can find them
// without touching anything a human made.
export const TEST_EMAIL_PREFIX = 'pwtest-';

export const uniqueEmail = () =>
  `${TEST_EMAIL_PREFIX}${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`;

export const PASSWORD = 'playwright-pass-1';

/**
 * Display names must be unique too, not just emails. Retries and repeated runs
 * otherwise leave several "Perfect Twin" cards on screen and every
 * name-based locator becomes ambiguous.
 */
export const uniqueName = (base) =>
  `${base} ${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

/** One complete set of quiz answers, so two users can be made to match exactly. */
export const ALL_ANSWERS = {
  hobby1: 'Comedies',
  hobby2: 'Reading a good book',
  hobby3: 'Jazz',
  hobby4: 'Voice Notes',
  hobby5: 'Beach Relaxation',
  hobby6: 'Venting to a friend',
  hobby7: 'Quiet one-on-one conversations',
};

/** A set that shares no exact answer with ALL_ANSWERS. */
export const OPPOSITE_ANSWERS = {
  hobby1: 'Action/Thriller Movies',
  hobby2: 'Exploring new places',
  hobby3: 'Pop Hits',
  hobby4: 'In-person hangouts',
  hobby5: 'Mountain Trekking',
  hobby6: 'Working out or going for a run',
  hobby7: 'Big parties or events',
};

/**
 * Creates an account straight through the API. Use this when the test is about
 * something other than the signup form itself.
 */
export async function registerViaApi(request, overrides = {}) {
  const email = overrides.email || uniqueEmail();
  // Suffix the name so repeated runs and retries never collide on screen.
  const name = uniqueName(overrides.name || 'Playwright Tester');

  const response = await request.post(`${API_URL}/api/auth/register`, {
    data: {
      password: PASSWORD,
      confirmPassword: PASSWORD,
      age: 24,
      gender: 'female',
      ...overrides,
      verified: undefined,
      name,
      email,
    },
  });

  if (!response.ok()) {
    throw new Error(`register failed: ${response.status()} ${await response.text()}`);
  }

  const body = await response.json();
  const account = { name, email, token: body.token, user: body.data.user };

  // Most tests are about what a real member can do, and the social surface is
  // gated on a confirmed email. Pass { verified: false } to test the gate.
  if (overrides.verified !== false) {
    await verifyViaApi(request, email);
    account.user.isVerified = true;
  }

  return account;
}

/**
 * Confirms an address by reading the link out of the dev inbox, exactly as a
 * person would from their email. No test back door into the database.
 */
export async function verifyViaApi(request, email) {
  const inbox = await request.get(
    `${API_URL}/api/dev/emails/latest?to=${encodeURIComponent(email)}`
  );
  if (!inbox.ok()) {
    throw new Error(`no verification email for ${email}: ${inbox.status()}`);
  }

  const mail = (await inbox.json()).data.email;
  const link = (mail.text || '').match(/\/verify-email\/([a-f0-9]{64})/);
  if (!link) {
    throw new Error(`no verification link in the email to ${email}`);
  }

  const confirmed = await request.get(`${API_URL}/api/auth/verify-email/${link[1]}`);
  if (!confirmed.ok()) {
    throw new Error(`verify failed for ${email}: ${confirmed.status()}`);
  }
}

/** Saves quiz answers for a token holder without driving the quiz UI. */
export async function submitAnswers(request, token, hobbies) {
  const response = await request.post(`${API_URL}/api/auth/submit-answers`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { hobbies },
  });

  if (!response.ok()) {
    throw new Error(`submit-answers failed: ${response.status()} ${await response.text()}`);
  }
}

/** Puts a token in localStorage before the app boots, so the page loads signed in. */
export async function signIn(page, token) {
  await page.addInitScript((value) => {
    try {
      localStorage.setItem('token', value);
    } catch {
      /* storage unavailable, the test will fail on the assertion instead */
    }
  }, token);
}

/** Answers the whole quiz by taking the first option on every question. */
export async function completeQuiz(page) {
  const options = page.locator('button[aria-pressed]');
  const total = await page.locator('[role="progressbar"]').count();
  if (total === 0) throw new Error('not on the quiz page');

  // The quiz is seven questions; loop defensively rather than hardcoding.
  for (let guard = 0; guard < 20; guard++) {
    await options.first().click();

    const finish = page.getByRole('button', { name: 'Finish' });
    if (await finish.count()) {
      await finish.click();
      return;
    }

    await page.getByRole('button', { name: 'Next' }).click();
  }

  throw new Error('quiz did not reach a Finish button');
}
