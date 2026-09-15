import { test, expect } from '@playwright/test';
import {
  API_URL,
  registerViaApi,
  submitAnswers,
  signIn,
  ALL_ANSWERS,
  OPPOSITE_ANSWERS,
} from './helpers';

test.describe('discover ranking', () => {
  test('a perfect match scores 100% and lists the shared answers', async ({ page, request }) => {
    const twin = await registerViaApi(request, { name: 'Perfect Twin' });
    await submitAnswers(request, twin.token, ALL_ANSWERS);

    const me = await registerViaApi(request, { name: 'Browsing Member' });
    await submitAnswers(request, me.token, ALL_ANSWERS);
    await signIn(page, me.token);

    await page.goto('/show-users');

    const card = page.locator('article').filter({ hasText: twin.name });
    await expect(card).toBeVisible();
    await expect(card.getByText('100%')).toBeVisible();
    await expect(card.getByText('You both picked')).toBeVisible();

    // Emails must never reach the browser.
    await expect(page.getByText(twin.email)).toHaveCount(0);

    // The caller is never listed among their own matches.
    await expect(page.getByRole('heading', { name: me.name })).toHaveCount(0);
  });

  test('matches are ordered best first', async ({ request }) => {
    const twin = await registerViaApi(request, { name: 'Order Twin' });
    await submitAnswers(request, twin.token, ALL_ANSWERS);

    const opposite = await registerViaApi(request, { name: 'Order Opposite' });
    await submitAnswers(request, opposite.token, OPPOSITE_ANSWERS);

    const me = await registerViaApi(request, { name: 'Order Viewer' });
    await submitAnswers(request, me.token, ALL_ANSWERS);

    // A shared test database accumulates members, so ask for enough of the
    // list to be sure both of this test's users are on the page.
    const response = await request.get(`${API_URL}/api/discover?limit=50`, {
      headers: { Authorization: `Bearer ${me.token}` },
    });
    const body = await response.json();

    const twinEntry = body.data.matches.find((m) => m.user.name === twin.name);
    const oppositeEntry = body.data.matches.find((m) => m.user.name === opposite.name);

    expect(twinEntry, 'the 100% twin should be in the first page of matches').toBeTruthy();
    expect(oppositeEntry, 'the opposite should be in the first page of matches').toBeTruthy();

    expect(twinEntry.percent).toBe(100);
    expect(oppositeEntry.percent).toBeLessThan(twinEntry.percent);
    expect(body.data.matches.indexOf(twinEntry)).toBeLessThan(
      body.data.matches.indexOf(oppositeEntry)
    );
  });

  test('members who have not finished the quiz are not ranked', async ({ page, request }) => {
    const rookie = await registerViaApi(request, { name: 'Quiz Rookie' });
    expect(rookie.token).toBeTruthy();

    const me = await registerViaApi(request, { name: 'Ranked Member' });
    await submitAnswers(request, me.token, ALL_ANSWERS);
    await signIn(page, me.token);

    await page.goto('/show-users');

    await expect(page.getByRole('heading', { name: 'New members' })).toBeVisible();
    await expect(page.getByRole('heading', { name: rookie.name })).toBeVisible();

    // The invariant: they are never ranked, whatever else is in the list.
    const response = await request.get(`${API_URL}/api/discover?limit=50`, {
      headers: { Authorization: `Bearer ${me.token}` },
    });
    const body = await response.json();
    expect(body.data.matches.some((m) => m.user.name === rookie.name)).toBe(false);
  });

  test('the score filter narrows the list', async ({ page, request }) => {
    const twin = await registerViaApi(request, { name: 'Filter Twin' });
    await submitAnswers(request, twin.token, ALL_ANSWERS);

    const opposite = await registerViaApi(request, { name: 'Filter Opposite' });
    await submitAnswers(request, opposite.token, OPPOSITE_ANSWERS);

    const me = await registerViaApi(request, { name: 'Filter Viewer' });
    await submitAnswers(request, me.token, ALL_ANSWERS);
    await signIn(page, me.token);

    // The filter itself, checked where the whole list is visible.
    const filtered = await request.get(`${API_URL}/api/discover?minScore=80&limit=50`, {
      headers: { Authorization: `Bearer ${me.token}` },
    });
    const names = (await filtered.json()).data.matches.map((entry) => entry.user.name);
    expect(names).toContain(twin.name);
    expect(names).not.toContain(opposite.name);

    // And that the control actually applies it.
    await page.goto('/show-users');
    const total = async () =>
      Number((await page.getByText(/\d+ matches?$/).innerText()).split(' ')[0]);
    const before = await total();

    await page.getByRole('button', { name: '80%+' }).click();
    await expect(page.getByText(`${before} matches`)).toHaveCount(0);
    await expect(page.locator('article').filter({ hasText: opposite.name })).toHaveCount(0);
  });
});

test.describe('match detail', () => {
  test('shows every question side by side', async ({ page, request }) => {
    const twin = await registerViaApi(request, { name: 'Detail Twin' });
    await submitAnswers(request, twin.token, ALL_ANSWERS);

    const me = await registerViaApi(request, { name: 'Detail Viewer' });
    await submitAnswers(request, me.token, ALL_ANSWERS);
    await signIn(page, me.token);

    await page.goto('/show-users');
    await page
      .locator('article')
      .filter({ hasText: twin.name })
      .getByRole('link', { name: 'See why you match' })
      .click();

    await expect(page).toHaveURL(/\/discover\/[a-f0-9]{24}$/);
    await expect(page.getByRole('heading', { name: twin.name })).toBeVisible();

    // Seven question rows, every one an exact match.
    await expect(page.getByText('Same answer', { exact: true })).toHaveCount(8); // 7 rows + stat label
    await expect(page.getByText('Beach Relaxation').first()).toBeVisible();
  });

  test('viewing your own id is refused', async ({ request }) => {
    const me = await registerViaApi(request);

    const response = await request.get(`${API_URL}/api/discover/${me.user._id}`, {
      headers: { Authorization: `Bearer ${me.token}` },
    });

    expect(response.status()).toBe(400);
  });

  test('an unknown id returns 404 rather than an error page', async ({ request }) => {
    const me = await registerViaApi(request);

    for (const id of ['507f1f77bcf86cd799439011', 'not-a-real-id']) {
      const response = await request.get(`${API_URL}/api/discover/${id}`, {
        headers: { Authorization: `Bearer ${me.token}` },
      });
      expect(response.status(), `id ${id}`).toBe(404);
    }
  });
});

test.describe('api surface', () => {
  test('discover requires a token', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/discover`);
    expect(response.status()).toBe(401);
  });

  test('the retired show-users endpoint is gone', async ({ request }) => {
    const me = await registerViaApi(request);

    const response = await request.get(`${API_URL}/api/auth/show-users`, {
      headers: { Authorization: `Bearer ${me.token}` },
    });

    expect(response.status()).toBe(404);
  });
});
