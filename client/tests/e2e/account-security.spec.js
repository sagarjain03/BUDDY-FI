import { test, expect } from '@playwright/test';
import { API_URL, registerViaApi, signIn, PASSWORD } from './helpers';

/** Reads the most recent email sent to an address out of the dev inbox. */
async function latestEmail(request, to) {
  const response = await request.get(
    `${API_URL}/api/dev/emails/latest?to=${encodeURIComponent(to)}`
  );
  expect(response.ok(), `no email for ${to}`).toBe(true);
  return (await response.json()).data.email;
}

const tokenFrom = (text, kind) => {
  const match = (text || '').match(new RegExp(`/${kind}/([a-f0-9]{64})`));
  expect(match, `no ${kind} link in the email`).toBeTruthy();
  return match[1];
};

test.describe('email verification', () => {
  test('a new account starts unverified and is locked out of the social surface', async ({
    request,
  }) => {
    const me = await registerViaApi(request, { name: 'Unverified', verified: false });
    const auth = { Authorization: `Bearer ${me.token}` };

    expect(me.user.isVerified).toBe(false);

    for (const path of ['/api/discover', '/api/connections', '/api/conversations']) {
      const response = await request.get(`${API_URL}${path}`, { headers: auth });
      expect(response.status(), path).toBe(403);
      expect((await response.json()).code).toBe('EMAIL_NOT_VERIFIED');
    }

    // Their own account still works — verification gates other people, not you.
    expect((await request.get(`${API_URL}/api/auth/me`, { headers: auth })).status()).toBe(200);

    const quiz = await request.post(`${API_URL}/api/auth/submit-answers`, {
      headers: auth,
      data: { hobbies: { hobby1: 'Comedies' } },
    });
    expect(quiz.status(), 'the quiz must stay open to unverified accounts').toBe(200);
  });

  test('the emailed link confirms the account, and cannot be reused', async ({ request }) => {
    const me = await registerViaApi(request, { name: 'Link User', verified: false });
    const mail = await latestEmail(request, me.email);
    const token = tokenFrom(mail.text, 'verify-email');

    expect((await request.get(`${API_URL}/api/auth/verify-email/deadbeef`)).status()).toBe(400);
    expect((await request.get(`${API_URL}/api/auth/verify-email/${token}`)).status()).toBe(200);
    expect(
      (await request.get(`${API_URL}/api/auth/verify-email/${token}`)).status(),
      'a used link must not work twice'
    ).toBe(400);

    const discover = await request.get(`${API_URL}/api/discover`, {
      headers: { Authorization: `Bearer ${me.token}` },
    });
    expect(discover.status()).toBe(200);
  });

  test('unverified members are invisible to everyone else', async ({ request }) => {
    const ghost = await registerViaApi(request, { name: 'Ghost Member', verified: false });
    const viewer = await registerViaApi(request, { name: 'Real Member' });

    const response = await request.get(`${API_URL}/api/discover?limit=50`, {
      headers: { Authorization: `Bearer ${viewer.token}` },
    });
    const body = await response.json();
    const everyone = [...body.data.matches, ...body.data.newMembers].map((m) => m.user.name);

    expect(everyone).not.toContain(ghost.name);
  });

  test('the banner appears for unverified members and offers a resend', async ({
    page,
    request,
  }) => {
    const me = await registerViaApi(request, { name: 'Banner User', verified: false });
    await signIn(page, me.token);

    await page.goto('/profile');
    await expect(page.getByText('Confirm your email')).toBeVisible();

    await page.getByRole('button', { name: 'Resend email' }).click();
    await expect(page.getByText('Sent — check your inbox')).toBeVisible();
  });

  test('the banner is absent once verified', async ({ page, request }) => {
    const me = await registerViaApi(request, { name: 'Verified User' });
    await signIn(page, me.token);

    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: 'Your profile' })).toBeVisible();
    await expect(page.getByText('Confirm your email')).toHaveCount(0);
  });
});

test.describe('password reset', () => {
  test('forgot-password answers identically for known and unknown emails', async ({
    request,
  }) => {
    const me = await registerViaApi(request);

    const known = await request.post(`${API_URL}/api/auth/forgot-password`, {
      data: { email: me.email },
    });
    const unknown = await request.post(`${API_URL}/api/auth/forgot-password`, {
      data: { email: 'definitely-nobody@example.test' },
    });

    expect(known.status()).toBe(unknown.status());
    expect(await known.json()).toEqual(await unknown.json());
  });

  test('a reset link sets a new password and kills the old session', async ({ request }) => {
    const me = await registerViaApi(request, { name: 'Reset User' });

    await request.post(`${API_URL}/api/auth/forgot-password`, { data: { email: me.email } });
    const mail = await latestEmail(request, me.email);
    const token = tokenFrom(mail.text, 'reset-password');

    // Validation still applies on the reset form.
    const short = await request.post(`${API_URL}/api/auth/reset-password/${token}`, {
      data: { password: 'short', confirmPassword: 'short' },
    });
    expect(short.status()).toBe(400);

    const reset = await request.post(`${API_URL}/api/auth/reset-password/${token}`, {
      data: { password: 'brand-new-pass-9', confirmPassword: 'brand-new-pass-9' },
    });
    expect(reset.status()).toBe(200);
    const fresh = (await reset.json()).token;
    expect(fresh).toBeTruthy();

    // The link is spent.
    const reuse = await request.post(`${API_URL}/api/auth/reset-password/${token}`, {
      data: { password: 'another-pass-99', confirmPassword: 'another-pass-99' },
    });
    expect(reuse.status()).toBe(400);

    // Old token dead, new token alive.
    expect(
      (await request.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${me.token}` },
      })).status()
    ).toBe(401);
    expect(
      (await request.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${fresh}` },
      })).status()
    ).toBe(200);

    // Old password gone, new password works.
    expect(
      (await request.post(`${API_URL}/api/auth/login`, {
        data: { email: me.email, password: PASSWORD },
      })).status()
    ).toBe(401);
    expect(
      (await request.post(`${API_URL}/api/auth/login`, {
        data: { email: me.email, password: 'brand-new-pass-9' },
      })).status()
    ).toBe(200);
  });

  test('the forgot-password page reaches the sent state', async ({ page, request }) => {
    const me = await registerViaApi(request);

    await page.goto('/login');
    await page.getByRole('link', { name: 'Forgot password?' }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);

    await page.getByLabel('Email').fill(me.email);
    await page.getByRole('button', { name: 'Send reset link' }).click();

    await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeVisible();
  });
});

test.describe('change password', () => {
  test('requires the current password and rotates the session', async ({ request }) => {
    const me = await registerViaApi(request, { name: 'Changer' });
    const auth = { Authorization: `Bearer ${me.token}` };

    const wrong = await request.patch(`${API_URL}/api/auth/change-password`, {
      headers: auth,
      data: {
        currentPassword: 'not-my-password',
        password: 'a-good-new-pass-1',
        confirmPassword: 'a-good-new-pass-1',
      },
    });
    expect(wrong.status()).toBe(401);

    const changed = await request.patch(`${API_URL}/api/auth/change-password`, {
      headers: auth,
      data: {
        currentPassword: PASSWORD,
        password: 'a-good-new-pass-1',
        confirmPassword: 'a-good-new-pass-1',
      },
    });
    expect(changed.status()).toBe(200);
    const fresh = (await changed.json()).token;

    // The token that made the change is itself retired.
    expect(
      (await request.get(`${API_URL}/api/auth/me`, { headers: auth })).status()
    ).toBe(401);
    expect(
      (await request.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${fresh}` },
      })).status()
    ).toBe(200);
  });
});
