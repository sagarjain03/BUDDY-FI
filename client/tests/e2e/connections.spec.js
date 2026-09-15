import { test, expect } from '@playwright/test';
import { API_URL, registerViaApi, submitAnswers, signIn, ALL_ANSWERS } from './helpers';

/** Sends a connection request straight through the API. */
const connect = (request, token, userId) =>
  request.post(`${API_URL}/api/connections`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { userId },
  });

test.describe('connection rules', () => {
  test('a request cannot be duplicated in either direction', async ({ request }) => {
    const a = await registerViaApi(request, { name: 'Dup Alice' });
    const b = await registerViaApi(request, { name: 'Dup Bob' });

    expect((await connect(request, a.token, b.user._id)).status()).toBe(201);

    // Same direction again.
    expect((await connect(request, a.token, b.user._id)).status()).toBe(409);

    // Reverse direction accepts the existing request rather than duplicating it.
    const reverse = await connect(request, b.token, a.user._id);
    expect(reverse.status()).toBe(200);
    expect((await reverse.json()).data.connection.status).toBe('accepted');
  });

  test('you cannot connect with yourself', async ({ request }) => {
    const me = await registerViaApi(request);
    const response = await connect(request, me.token, me.user._id);
    expect(response.status()).toBe(400);
  });

  test('only the recipient can accept, and only once', async ({ request }) => {
    const a = await registerViaApi(request, { name: 'Auth Alice' });
    const b = await registerViaApi(request, { name: 'Auth Bob' });
    const c = await registerViaApi(request, { name: 'Auth Carol' });

    const created = await connect(request, a.token, b.user._id);
    const id = (await created.json()).data.connection.id;

    const asRequester = await request.patch(`${API_URL}/api/connections/${id}/accept`, {
      headers: { Authorization: `Bearer ${a.token}` },
    });
    expect(asRequester.status(), 'requester must not accept their own request').toBe(403);

    const asStranger = await request.patch(`${API_URL}/api/connections/${id}/accept`, {
      headers: { Authorization: `Bearer ${c.token}` },
    });
    expect(asStranger.status(), 'a third party must not accept').toBe(403);

    const asRecipient = await request.patch(`${API_URL}/api/connections/${id}/accept`, {
      headers: { Authorization: `Bearer ${b.token}` },
    });
    expect(asRecipient.status()).toBe(200);

    const again = await request.patch(`${API_URL}/api/connections/${id}/accept`, {
      headers: { Authorization: `Bearer ${b.token}` },
    });
    expect(again.status(), 'accepting twice should conflict').toBe(409);
  });

  test('removing an accepted connection clears it for both sides', async ({ request }) => {
    const a = await registerViaApi(request, { name: 'Drop Alice' });
    const b = await registerViaApi(request, { name: 'Drop Bob' });

    const created = await connect(request, a.token, b.user._id);
    const id = (await created.json()).data.connection.id;
    await request.patch(`${API_URL}/api/connections/${id}/accept`, {
      headers: { Authorization: `Bearer ${b.token}` },
    });

    await request.delete(`${API_URL}/api/connections/${id}`, {
      headers: { Authorization: `Bearer ${a.token}` },
    });

    for (const [who, token] of [
      ['Alice', a.token],
      ['Bob', b.token],
    ]) {
      const response = await request.get(`${API_URL}/api/connections`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await response.json();
      expect(body.data.buddies.length, `${who} should have no buddies left`).toBe(0);
    }
  });

  test('a recipient cannot withdraw, and a requester cannot decline', async ({ request }) => {
    const a = await registerViaApi(request, { name: 'Role Alice' });
    const b = await registerViaApi(request, { name: 'Role Bob' });

    const created = await connect(request, a.token, b.user._id);
    const id = (await created.json()).data.connection.id;

    const recipientWithdraw = await request.delete(`${API_URL}/api/connections/${id}`, {
      headers: { Authorization: `Bearer ${b.token}` },
    });
    expect(recipientWithdraw.status()).toBe(403);

    const requesterDecline = await request.patch(`${API_URL}/api/connections/${id}/decline`, {
      headers: { Authorization: `Bearer ${a.token}` },
    });
    expect(requesterDecline.status()).toBe(403);
  });

  test('a declined request can be sent again', async ({ request }) => {
    const a = await registerViaApi(request, { name: 'Retry Alice' });
    const b = await registerViaApi(request, { name: 'Retry Bob' });

    const created = await connect(request, a.token, b.user._id);
    const id = (await created.json()).data.connection.id;

    await request.patch(`${API_URL}/api/connections/${id}/decline`, {
      headers: { Authorization: `Bearer ${b.token}` },
    });

    const retry = await connect(request, a.token, b.user._id);
    expect(retry.status()).toBe(201);
  });

  test('connection endpoints require a token', async ({ request }) => {
    for (const path of ['/api/connections', '/api/connections/pending', '/api/connections/sent']) {
      const response = await request.get(`${API_URL}${path}`);
      expect(response.status(), path).toBe(401);
    }
  });

  test('buddy lists never contain email addresses', async ({ request }) => {
    const a = await registerViaApi(request, { name: 'Private Alice' });
    const b = await registerViaApi(request, { name: 'Private Bob' });

    const created = await connect(request, a.token, b.user._id);
    const id = (await created.json()).data.connection.id;
    await request.patch(`${API_URL}/api/connections/${id}/accept`, {
      headers: { Authorization: `Bearer ${b.token}` },
    });

    const response = await request.get(`${API_URL}/api/connections`, {
      headers: { Authorization: `Bearer ${a.token}` },
    });
    const text = await response.text();

    expect(text).toContain('Private Bob');
    expect(text).not.toContain(b.email);
  });
});

test.describe('connection UI', () => {
  test('connect from Discover, accept from Buddies', async ({ page, browser, request }) => {
    const other = await registerViaApi(request, { name: 'Ui Target' });
    await submitAnswers(request, other.token, ALL_ANSWERS);

    const me = await registerViaApi(request, { name: 'Ui Sender' });
    await submitAnswers(request, me.token, ALL_ANSWERS);
    await signIn(page, me.token);

    // Straight to their page: Discover pages at 12, so hunting for one card
    // there is unreliable once the suite has created a hundred members.
    await page.goto(`/discover/${other.user._id}`);
    await expect(page.getByRole('heading', { name: other.name })).toBeVisible();

    await page.getByRole('button', { name: 'Connect' }).click();
    await expect(page.getByRole('button', { name: 'Requested' })).toBeVisible();

    // The other person sees it and accepts.
    const theirContext = await browser.newContext();
    await theirContext.addInitScript((token) => {
      try {
        localStorage.setItem('token', token);
      } catch {
        /* ignore */
      }
    }, other.token);
    const theirPage = await theirContext.newPage();

    await theirPage.goto('/buddies');
    await theirPage.getByRole('button', { name: /Requests/ }).click();

    // The list re-fetches when the tab changes; wait for it rather than racing.
    await expect(theirPage.getByRole('heading', { name: 'Your buddies' })).toBeVisible();
    const row = theirPage.locator('article').filter({ hasText: me.name });
    await expect(row).toBeVisible({ timeout: 20_000 });
    await row.getByRole('button', { name: 'Accept' }).click();

    // Now they are buddies on both sides.
    await theirPage.getByRole('button', { name: 'Buddies', exact: true }).click();
    await expect(theirPage.locator('article').filter({ hasText: me.name })).toBeVisible();

    await page.goto('/buddies');
    await expect(page.locator('article').filter({ hasText: other.name })).toBeVisible();

    await theirContext.close();
  });

  test('a pending request shows a badge in the navbar', async ({ page, request }) => {
    const sender = await registerViaApi(request, { name: 'Badge Sender' });
    const me = await registerViaApi(request, { name: 'Badge Receiver' });

    await connect(request, sender.token, me.user._id);

    // Confirm the count the badge renders from, before asserting on the badge.
    const counts = await request.get(`${API_URL}/api/connections/counts`, {
      headers: { Authorization: `Bearer ${me.token}` },
    });
    expect((await counts.json()).data.incoming).toBe(1);

    await signIn(page, me.token);
    await page.goto('/welcome');

    await expect(page.getByRole('link', { name: /Buddies/ })).toContainText('1');
  });
});
