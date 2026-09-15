import { test, expect } from '@playwright/test';
import { API_URL, registerViaApi, submitAnswers, signIn, ALL_ANSWERS, PASSWORD } from './helpers';

const auth = (token) => ({ Authorization: `Bearer ${token}` });

async function member(request, name) {
  const account = await registerViaApi(request, { name });
  await submitAnswers(request, account.token, ALL_ANSWERS);
  return account;
}

/** Two members who are connected and have a conversation open. */
async function connectedPair(request, nameA, nameB) {
  const a = await member(request, nameA);
  const b = await member(request, nameB);

  const created = await request.post(`${API_URL}/api/connections`, {
    headers: auth(a.token),
    data: { userId: b.user._id },
  });
  const connectionId = (await created.json()).data.connection.id;
  await request.patch(`${API_URL}/api/connections/${connectionId}/accept`, {
    headers: auth(b.token),
  });

  const opened = await request.post(`${API_URL}/api/conversations`, {
    headers: auth(a.token),
    data: { userId: b.user._id },
  });
  const conversationId = (await opened.json()).data.conversation._id;

  return { a, b, conversationId };
}

const discoverNames = async (request, token) => {
  const response = await request.get(`${API_URL}/api/discover?limit=50`, { headers: auth(token) });
  const body = await response.json();
  return [...body.data.matches, ...body.data.newMembers].map((entry) => entry.user.name);
};

test.describe('blocking', () => {
  test('a block works in both directions and tears down the relationship', async ({
    request,
  }) => {
    const { a, b, conversationId } = await connectedPair(request, 'Blk Alice', 'Blk Bob');

    // Before: they can see each other and are connected.
    expect(await discoverNames(request, a.token)).toContain(b.name);
    expect(
      (await (await request.get(`${API_URL}/api/connections`, { headers: auth(a.token) })).json())
        .results
    ).toBe(1);

    const blocked = await request.post(`${API_URL}/api/blocks`, {
      headers: auth(a.token),
      data: { userId: b.user._id },
    });
    expect(blocked.status()).toBe(201);

    // Invisible both ways.
    expect(await discoverNames(request, a.token)).not.toContain(b.name);
    expect(
      await discoverNames(request, b.token),
      'the blocked person must not see the blocker either'
    ).not.toContain(a.name);

    // The connection and the conversation are gone for both.
    for (const [who, token] of [
      ['alice', a.token],
      ['bob', b.token],
    ]) {
      const connections = await request.get(`${API_URL}/api/connections`, {
        headers: auth(token),
      });
      expect((await connections.json()).results, `${who} connections`).toBe(0);

      const conversations = await request.get(`${API_URL}/api/conversations`, {
        headers: auth(token),
      });
      expect((await conversations.json()).results, `${who} conversations`).toBe(0);
    }

    // And the history cannot be reopened by id.
    const history = await request.get(`${API_URL}/api/conversations/${conversationId}/messages`, {
      headers: auth(b.token),
    });
    expect(history.status(), 'a blocked member must not read the old thread').toBe(404);
  });

  test('a blocked member cannot reach the other by guessing their id', async ({ request }) => {
    const a = await member(request, 'Guess Alice');
    const b = await member(request, 'Guess Bob');

    await request.post(`${API_URL}/api/blocks`, {
      headers: auth(a.token),
      data: { userId: b.user._id },
    });

    // "Not found" rather than "you are blocked" — the latter tells them exactly
    // what happened.
    const detail = await request.get(`${API_URL}/api/discover/${a.user._id}`, {
      headers: auth(b.token),
    });
    expect(detail.status()).toBe(404);

    const connect = await request.post(`${API_URL}/api/connections`, {
      headers: auth(b.token),
      data: { userId: a.user._id },
    });
    expect(connect.status()).toBe(404);

    const conversation = await request.post(`${API_URL}/api/conversations`, {
      headers: auth(b.token),
      data: { userId: a.user._id },
    });
    expect(conversation.status()).toBe(403);
  });

  test('unblocking restores visibility but not the old connection', async ({ request }) => {
    const { a, b } = await connectedPair(request, 'Undo Alice', 'Undo Bob');

    const visible = () =>
      request
        .get(`${API_URL}/api/discover/${b.user._id}`, { headers: auth(a.token) })
        .then((response) => response.status());

    await request.post(`${API_URL}/api/blocks`, {
      headers: auth(a.token),
      data: { userId: b.user._id },
    });
    expect(await visible(), 'blocked members read as not found').toBe(404);

    await request.delete(`${API_URL}/api/blocks/${b.user._id}`, { headers: auth(a.token) });

    // Asked directly rather than through the paginated list, which grows.
    expect(await visible(), 'unblocking makes them reachable again').toBe(200);

    const connections = await request.get(`${API_URL}/api/connections`, { headers: auth(a.token) });
    expect(
      (await connections.json()).results,
      'the connection must not come back on its own'
    ).toBe(0);
  });

  test('you cannot block yourself', async ({ request }) => {
    const me = await registerViaApi(request);

    const response = await request.post(`${API_URL}/api/blocks`, {
      headers: auth(me.token),
      data: { userId: me.user._id },
    });
    expect(response.status()).toBe(400);
  });
});

test.describe('reporting', () => {
  test('a report is filed, and block-and-report does both', async ({ request }) => {
    const target = await member(request, 'Rep Target');
    const reporter = await member(request, 'Rep Reporter');

    const plain = await request.post(`${API_URL}/api/reports`, {
      headers: auth(reporter.token),
      data: { userId: target.user._id, category: 'harassment', details: 'Rude messages' },
    });
    expect(plain.status()).toBe(201);
    // A plain report does not hide them.
    expect(await discoverNames(request, reporter.token)).toContain(target.name);

    const other = await member(request, 'Rep Target Two');
    const both = await request.post(`${API_URL}/api/reports`, {
      headers: auth(reporter.token),
      data: { userId: other.user._id, category: 'spam', block: true },
    });
    expect(both.status()).toBe(201);
    expect(await discoverNames(request, reporter.token)).not.toContain(other.name);
  });

  test('bad input is refused', async ({ request }) => {
    const target = await member(request, 'Bad Input Target');
    const me = await member(request, 'Bad Input Reporter');

    const badCategory = await request.post(`${API_URL}/api/reports`, {
      headers: auth(me.token),
      data: { userId: target.user._id, category: 'nonsense' },
    });
    expect(badCategory.status()).toBe(400);

    const self = await request.post(`${API_URL}/api/reports`, {
      headers: auth(me.token),
      data: { userId: me.user._id, category: 'spam' },
    });
    expect(self.status()).toBe(400);
  });

  test('the admin queue is closed to ordinary members', async ({ request }) => {
    const me = await registerViaApi(request);

    const list = await request.get(`${API_URL}/api/admin/reports`, { headers: auth(me.token) });
    expect(list.status()).toBe(403);

    const update = await request.patch(`${API_URL}/api/admin/reports/507f1f77bcf86cd799439011`, {
      headers: auth(me.token),
      data: { status: 'dismissed' },
    });
    expect(update.status()).toBe(403);
  });

  test('safety endpoints require a token', async ({ request }) => {
    for (const path of ['/api/blocks', '/api/admin/reports']) {
      expect((await request.get(`${API_URL}${path}`)).status(), path).toBe(401);
    }
    expect((await request.post(`${API_URL}/api/reports`, { data: {} })).status()).toBe(401);
  });
});

test.describe('safety UI', () => {
  test('block from a conversation clears it from the list', async ({ page, request }) => {
    const { a, b, conversationId } = await connectedPair(request, 'Ui Blocker', 'Ui Blocked');

    await signIn(page, a.token);
    await page.goto(`/chat/${conversationId}`);

    await page.getByRole('button', { name: `Safety options for ${b.name}` }).click();
    await page.getByRole('button', { name: 'Block', exact: true }).click();

    await expect(page).toHaveURL(/\/chat$/);
    await expect(page.getByText('No conversations yet')).toBeVisible();
  });

  test('the block list shows who you blocked and can undo it', async ({ page, request }) => {
    const target = await member(request, 'List Blocked');
    const me = await member(request, 'List Blocker');

    await request.post(`${API_URL}/api/blocks`, {
      headers: auth(me.token),
      data: { userId: target.user._id },
    });

    await signIn(page, me.token);
    await page.goto('/profile/blocked');

    const row = page.locator('article').filter({ hasText: target.name });
    await expect(row).toBeVisible();

    await row.getByRole('button', { name: 'Unblock' }).click();
    await expect(page.getByText(/Unblocked/)).toBeVisible();
    await expect(page.locator('article').filter({ hasText: target.name })).toHaveCount(0);
  });

  test('an ordinary member sees the admin queue as closed', async ({ page, request }) => {
    const me = await member(request, 'Not Admin');
    await signIn(page, me.token);

    await page.goto('/admin/reports');
    await expect(page.getByText('Admins only')).toBeVisible();
  });
});

test.describe('login lockout', () => {
  test('repeated wrong passwords lock the account, and the right one is refused too', async ({
    request,
  }) => {
    const me = await registerViaApi(request);

    // The limiter is off for the suite, so this exercises the per-account
    // lockout rather than the per-IP rate limit.
    let sawLockout = false;
    for (let attempt = 0; attempt < 9; attempt++) {
      const response = await request.post(`${API_URL}/api/auth/login`, {
        data: { email: me.email, password: 'wrong-password-here' },
      });
      if (response.status() === 429) {
        sawLockout = true;
        break;
      }
      expect(response.status()).toBe(401);
    }

    expect(sawLockout, 'the account should lock after repeated failures').toBe(true);

    // Even the correct password is refused while locked.
    const correct = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: me.email, password: PASSWORD },
    });
    expect(correct.status()).toBe(429);
  });

  test('a successful login clears the failure count', async ({ request }) => {
    const me = await registerViaApi(request);

    for (let attempt = 0; attempt < 3; attempt++) {
      await request.post(`${API_URL}/api/auth/login`, {
        data: { email: me.email, password: 'wrong-password-here' },
      });
    }

    const good = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: me.email, password: PASSWORD },
    });
    expect(good.status()).toBe(200);

    // Three more failures must not immediately lock, which would mean the
    // counter was never reset.
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await request.post(`${API_URL}/api/auth/login`, {
        data: { email: me.email, password: 'wrong-password-here' },
      });
      expect(response.status()).toBe(401);
    }
  });
});

test.describe('sessions', () => {
  test('logging out ends that session on the server, not just locally', async ({ request }) => {
    const me = await registerViaApi(request);

    // A second device.
    const second = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: me.email, password: PASSWORD },
    });
    const secondToken = (await second.json()).token;

    const sessions = await request.get(`${API_URL}/api/auth/sessions`, {
      headers: auth(me.token),
    });
    expect((await sessions.json()).results).toBeGreaterThanOrEqual(2);

    await request.post(`${API_URL}/api/auth/logout`, { headers: auth(me.token) });

    // The token is dead even though the client still holds a copy.
    expect(
      (await request.get(`${API_URL}/api/auth/me`, { headers: auth(me.token) })).status()
    ).toBe(401);
    expect(
      (await request.get(`${API_URL}/api/auth/me`, { headers: auth(secondToken) })).status(),
      'the other device should stay signed in'
    ).toBe(200);
  });

  test('log out everywhere keeps only the current device', async ({ request }) => {
    const me = await registerViaApi(request);

    const other = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: me.email, password: PASSWORD },
    });
    const otherToken = (await other.json()).token;

    await request.delete(`${API_URL}/api/auth/sessions`, { headers: auth(otherToken) });

    expect(
      (await request.get(`${API_URL}/api/auth/me`, { headers: auth(otherToken) })).status()
    ).toBe(200);
    expect(
      (await request.get(`${API_URL}/api/auth/me`, { headers: auth(me.token) })).status()
    ).toBe(401);
  });
});
