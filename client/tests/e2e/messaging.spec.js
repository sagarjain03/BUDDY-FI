import { test, expect } from '@playwright/test';
import { API_URL, registerViaApi, signIn } from './helpers';

/** Registers two users and connects them, so they may message each other. */
async function connectedPair(request, nameA, nameB) {
  const a = await registerViaApi(request, { name: nameA });
  const b = await registerViaApi(request, { name: nameB });

  const created = await request.post(`${API_URL}/api/connections`, {
    headers: { Authorization: `Bearer ${a.token}` },
    data: { userId: b.user._id },
  });
  const connectionId = (await created.json()).data.connection.id;

  await request.patch(`${API_URL}/api/connections/${connectionId}/accept`, {
    headers: { Authorization: `Bearer ${b.token}` },
  });

  return { a, b, connectionId };
}

const openConversation = (request, token, userId) =>
  request.post(`${API_URL}/api/conversations`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { userId },
  });

test.describe('messaging rules', () => {
  test('you cannot open a conversation with someone you are not connected to', async ({
    request,
  }) => {
    const a = await registerViaApi(request, { name: 'Gate Alice' });
    const b = await registerViaApi(request, { name: 'Gate Bob' });

    const response = await openConversation(request, a.token, b.user._id);
    expect(response.status()).toBe(403);
  });

  test('connected people can open a conversation, and it is reused', async ({ request }) => {
    const { a, b } = await connectedPair(request, 'Open Alice', 'Open Bob');

    const first = await openConversation(request, a.token, b.user._id);
    expect(first.status()).toBe(200);
    const firstId = (await first.json()).data.conversation._id;

    // From the other side it must resolve to the same conversation.
    const second = await openConversation(request, b.token, a.user._id);
    expect((await second.json()).data.conversation._id).toBe(firstId);
  });

  test('you cannot message yourself', async ({ request }) => {
    const me = await registerViaApi(request);
    const response = await openConversation(request, me.token, me.user._id);
    expect(response.status()).toBe(400);
  });

  test('a non-participant cannot read the history', async ({ request }) => {
    const { a, b } = await connectedPair(request, 'Private Alice', 'Private Bob');
    const outsider = await registerViaApi(request, { name: 'Nosy Carol' });

    const opened = await openConversation(request, a.token, b.user._id);
    const conversationId = (await opened.json()).data.conversation._id;

    const response = await request.get(
      `${API_URL}/api/conversations/${conversationId}/messages`,
      { headers: { Authorization: `Bearer ${outsider.token}` } }
    );
    expect(response.status()).toBe(403);
  });

  test('conversation endpoints require a token', async ({ request }) => {
    for (const path of ['/api/conversations', '/api/conversations/unread-count']) {
      const response = await request.get(`${API_URL}${path}`);
      expect(response.status(), path).toBe(401);
    }
  });
});

test.describe('messaging UI', () => {
  test('two people exchange messages live, and history survives a reload', async ({
    page,
    browser,
    request,
  }) => {
    const { a, b } = await connectedPair(request, 'Live Alice', 'Live Bob');
    const opened = await openConversation(request, a.token, b.user._id);
    const conversationId = (await opened.json()).data.conversation._id;

    await signIn(page, a.token);
    await page.goto(`/chat/${conversationId}`);
    await expect(page.getByText('Connected', { exact: true })).toBeVisible();

    // Bob opens the same conversation in his own browser context.
    const bobContext = await browser.newContext();
    await bobContext.addInitScript((token) => {
      try {
        localStorage.setItem('token', token);
      } catch {
        /* ignore */
      }
    }, b.token);
    const bobPage = await bobContext.newPage();
    await bobPage.goto(`/chat/${conversationId}`);
    await expect(bobPage.getByText('Connected', { exact: true })).toBeVisible();

    // Alice sends, Bob receives without reloading.
    const bubble = (target, text) =>
      target.getByRole('paragraph').filter({ hasText: text }).first();

    await page.getByLabel('Message').fill('Hello from Alice');
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(bubble(bobPage, 'Hello from Alice')).toBeVisible();

    // Bob replies, Alice receives.
    await bobPage.getByLabel('Message').fill('Hi Alice, got it');
    await bobPage.getByRole('button', { name: 'Send' }).click();
    await expect(bubble(page, 'Hi Alice, got it')).toBeVisible();

    // History is persisted, not just in memory.
    await page.reload();
    await expect(bubble(page, 'Hello from Alice')).toBeVisible();
    await expect(bubble(page, 'Hi Alice, got it')).toBeVisible();

    await bobContext.close();
  });

  test('an unread message raises the navbar badge, and opening it clears it', async ({
    page,
    browser,
    request,
  }) => {
    const { a, b } = await connectedPair(request, 'Badge Alice', 'Badge Bob');
    const opened = await openConversation(request, a.token, b.user._id);
    const conversationId = (await opened.json()).data.conversation._id;

    // Alice sends while Bob is away.
    await signIn(page, a.token);
    await page.goto(`/chat/${conversationId}`);
    await page.getByLabel('Message').fill('You have mail');
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(
      page.getByRole('paragraph').filter({ hasText: 'You have mail' }).first()
    ).toBeVisible();

    const unread = await request.get(`${API_URL}/api/conversations/unread-count`, {
      headers: { Authorization: `Bearer ${b.token}` },
    });
    expect((await unread.json()).data.unread).toBe(1);

    // Bob needs his own context: signIn uses addInitScript, which re-applies
    // Alice's token on every navigation of the original page.
    const bobContext = await browser.newContext();
    await bobContext.addInitScript((token) => {
      try {
        localStorage.setItem('token', token);
      } catch {
        /* ignore */
      }
    }, b.token);
    const bobPage = await bobContext.newPage();

    await bobPage.goto('/welcome');
    await expect(bobPage.getByRole('link', { name: /Chat/ })).toContainText('1');

    await bobPage.goto(`/chat/${conversationId}`);
    await expect(
      bobPage.getByRole('paragraph').filter({ hasText: 'You have mail' }).first()
    ).toBeVisible();

    await expect
      .poll(async () => {
        const after = await request.get(`${API_URL}/api/conversations/unread-count`, {
          headers: { Authorization: `Bearer ${b.token}` },
        });
        return (await after.json()).data.unread;
      })
      .toBe(0);

    await bobContext.close();
  });

  test('the conversation list shows the latest message', async ({ page, request }) => {
    const { a, b } = await connectedPair(request, 'List Alice', 'List Bob');
    const opened = await openConversation(request, a.token, b.user._id);
    const conversationId = (await opened.json()).data.conversation._id;

    await signIn(page, a.token);
    await page.goto(`/chat/${conversationId}`);
    await page.getByLabel('Message').fill('Latest line here');
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(
      page.getByRole('paragraph').filter({ hasText: 'Latest line here' }).first()
    ).toBeVisible();

    await page.goto('/chat');
    await expect(
      page.getByRole('button').filter({ hasText: b.name })
    ).toContainText('Latest line here');
  });

  test('the empty state points at Discover when there are no conversations', async ({
    page,
    request,
  }) => {
    const me = await registerViaApi(request, { name: 'Lonely Member' });
    await signIn(page, me.token);

    await page.goto('/chat');
    await expect(page.getByText('No conversations yet')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Find people' })).toBeVisible();
  });
});
