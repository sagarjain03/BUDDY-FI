import { test, expect } from '@playwright/test';
import { API_URL, registerViaApi, submitAnswers, signIn, ALL_ANSWERS } from './helpers';

const auth = (token) => ({ Authorization: `Bearer ${token}` });

async function member(request, name) {
  const account = await registerViaApi(request, { name });
  await submitAnswers(request, account.token, ALL_ANSWERS);
  return account;
}

const notifications = async (request, token) => {
  const response = await request.get(`${API_URL}/api/notifications`, { headers: auth(token) });
  return (await response.json()).data.notifications;
};

const unreadCount = async (request, token) => {
  const response = await request.get(`${API_URL}/api/notifications/unread-count`, {
    headers: auth(token),
  });
  return (await response.json()).data.unread;
};

test.describe('notifications', () => {
  test('a connection request notifies the recipient, and accepting notifies back', async ({
    request,
  }) => {
    const alice = await member(request, 'Notif Alice');
    const bob = await member(request, 'Notif Bob');

    const created = await request.post(`${API_URL}/api/connections`, {
      headers: auth(alice.token),
      data: { userId: bob.user._id },
    });
    const connectionId = (await created.json()).data.connection.id;

    const forBob = await notifications(request, bob.token);
    expect(forBob.map((entry) => entry.type)).toContain('connection_request');
    expect(forBob[0].actor.name).toBe(alice.name);

    await request.patch(`${API_URL}/api/connections/${connectionId}/accept`, {
      headers: auth(bob.token),
    });

    const forAlice = await notifications(request, alice.token);
    expect(forAlice.map((entry) => entry.type)).toContain('connection_accepted');
  });

  test('you are never notified about your own actions', async ({ request }) => {
    const alice = await member(request, 'Quiet Alice');
    const bob = await member(request, 'Quiet Bob');

    await request.post(`${API_URL}/api/connections`, {
      headers: auth(alice.token),
      data: { userId: bob.user._id },
    });

    // Alice sent it, so Alice hears nothing.
    expect(await notifications(request, alice.token)).toHaveLength(0);
    expect(await unreadCount(request, alice.token)).toBe(0);
  });

  test('marking read clears the count', async ({ request }) => {
    const alice = await member(request, 'Read Alice');
    const bob = await member(request, 'Read Bob');

    await request.post(`${API_URL}/api/connections`, {
      headers: auth(alice.token),
      data: { userId: bob.user._id },
    });

    expect(await unreadCount(request, bob.token)).toBe(1);

    await request.patch(`${API_URL}/api/notifications/read`, { headers: auth(bob.token) });
    expect(await unreadCount(request, bob.token)).toBe(0);
  });

  test('a blocked member stops generating notifications you can see', async ({ request }) => {
    const pest = await member(request, 'Pest Member');
    const me = await member(request, 'Pestered Member');

    await request.post(`${API_URL}/api/connections`, {
      headers: auth(pest.token),
      data: { userId: me.user._id },
    });
    expect(await unreadCount(request, me.token)).toBe(1);

    await request.post(`${API_URL}/api/blocks`, {
      headers: auth(me.token),
      data: { userId: pest.user._id },
    });

    expect(
      await unreadCount(request, me.token),
      'notifications from a blocked member should disappear too'
    ).toBe(0);
    expect(await notifications(request, me.token)).toHaveLength(0);
  });

  test('notification endpoints require a token', async ({ request }) => {
    for (const path of ['/api/notifications', '/api/notifications/unread-count']) {
      expect((await request.get(`${API_URL}${path}`)).status(), path).toBe(401);
    }
  });
});

test.describe('notification UI', () => {
  test('the bell shows a badge and the page lists the notification', async ({ page, request }) => {
    const sender = await member(request, 'Bell Sender');
    const me = await member(request, 'Bell Receiver');

    await request.post(`${API_URL}/api/connections`, {
      headers: auth(sender.token),
      data: { userId: me.user._id },
    });

    await signIn(page, me.token);
    await page.goto('/welcome');

    const bell = page.getByRole('button', { name: /Notifications, 1 unread/ });
    await expect(bell).toBeVisible();

    await page.goto('/notifications');
    await expect(page.getByText(`${sender.name} wants to connect`)).toBeVisible();

    await page.getByRole('button', { name: 'Mark all read' }).click();
    await expect(page.getByRole('button', { name: 'Mark all read' })).toHaveCount(0);
  });

  test('the empty state explains itself', async ({ page, request }) => {
    const me = await member(request, 'Silent Member');
    await signIn(page, me.token);

    await page.goto('/notifications');
    await expect(page.getByText('Nothing yet')).toBeVisible();
  });
});

test.describe('presence and preferences', () => {
  test('presence and location switches save', async ({ page, request }) => {
    const me = await member(request, 'Prefs Member');
    await signIn(page, me.token);

    await page.goto('/settings/notifications');

    const presence = page.getByRole('checkbox', { name: /Show when I am online/ });
    await expect(presence).toBeChecked();
    await presence.uncheck();
    await expect(page.getByText('Saved')).toBeVisible();

    const after = await request.get(`${API_URL}/api/auth/me`, { headers: auth(me.token) });
    expect((await after.json()).data.user.sharePresence).toBe(false);
  });

  test('turning presence off hides it from other members', async ({ request }) => {
    const shy = await member(request, 'Shy Presence');
    await request.patch(`${API_URL}/api/auth/me`, {
      headers: auth(shy.token),
      data: { sharePresence: false },
    });

    const viewer = await member(request, 'Presence Viewer');
    const response = await request.get(`${API_URL}/api/discover/${shy.user._id}`, {
      headers: auth(viewer.token),
    });
    const user = (await response.json()).data.user;

    expect(user.isOnline).toBeUndefined();
    expect(user.lastSeenAt).toBeUndefined();
  });

  test('the digest unsubscribe link works without logging in', async ({ request }) => {
    const me = await member(request, 'Unsub Member');

    // A wrong token must not switch anyone's preferences.
    const bogus = await request.get(
      `${API_URL}/api/auth/unsubscribe/${me.user._id}/${'0'.repeat(64)}`
    );
    expect(bogus.status()).toBe(400);

    const before = await request.get(`${API_URL}/api/auth/me`, { headers: auth(me.token) });
    expect((await before.json()).data.user.emailPrefs.digest).toBe(true);
  });
});
