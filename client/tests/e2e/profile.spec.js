import { test, expect } from '@playwright/test';
import { API_URL, registerViaApi, signIn, uniqueEmail, PASSWORD } from './helpers';

// The smallest valid PNG there is, and a PDF wearing a .jpg name tag.
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);
const FAKE_IMAGE = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(300, 0x20)]);

const uploadAvatar = (request, token, buffer, name, mimeType) =>
  request.post(`${API_URL}/api/auth/me/avatar`, {
    headers: { Authorization: `Bearer ${token}` },
    multipart: { avatar: { name, mimeType, buffer } },
  });

test.describe('profile editing', () => {
  test('a member can change their own editable fields', async ({ request }) => {
    const me = await registerViaApi(request);

    const response = await request.patch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${me.token}` },
      data: {
        name: 'Renamed Person',
        bio: 'I make playlists nobody asked for.',
        interests: ['jazz', 'hiking', 'baking'],
        gender: 'non-binary',
        age: 31,
      },
    });

    expect(response.status()).toBe(200);
    const user = (await response.json()).data.user;
    expect(user.name).toBe('Renamed Person');
    expect(user.bio).toBe('I make playlists nobody asked for.');
    expect(user.interests).toEqual(['jazz', 'hiking', 'baking']);
    expect(user.gender).toBe('non-binary');
    expect(user.age).toBe(31);
  });

  test('fields outside the allowlist are ignored', async ({ request }) => {
    const me = await registerViaApi(request);

    await request.patch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${me.token}` },
      data: {
        isVerified: false,
        role: 'admin',
        email: 'stolen@example.test',
        password: 'hacked-into-place',
        _id: '000000000000000000000000',
      },
    });

    const after = await request.get(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${me.token}` },
    });
    const user = (await after.json()).data.user;

    expect(user.email, 'email must not be reassignable').toBe(me.email);
    expect(user.isVerified, 'verification must not be self-serve').toBe(true);
    expect(user._id).not.toBe('000000000000000000000000');

    // And the password was not quietly replaced.
    const login = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: me.email, password: PASSWORD },
    });
    expect(login.status()).toBe(200);
  });

  test('bio length and interest count are enforced on the server', async ({ request }) => {
    const me = await registerViaApi(request);
    const auth = { Authorization: `Bearer ${me.token}` };

    const longBio = await request.patch(`${API_URL}/api/auth/me`, {
      headers: auth,
      data: { bio: 'x'.repeat(241) },
    });
    expect(longBio.status()).toBe(400);

    const manyTags = await request.patch(`${API_URL}/api/auth/me`, {
      headers: auth,
      data: { interests: Array.from({ length: 20 }, (_, i) => `tag${i}`) },
    });
    expect(manyTags.status()).toBe(200);
    expect((await manyTags.json()).data.user.interests).toHaveLength(8);
  });
});

test.describe('gender options', () => {
  test('all five options register, and anything else is refused', async ({ request }) => {
    for (const gender of ['female', 'male', 'non-binary', 'other', 'prefer-not-to-say']) {
      const response = await request.post(`${API_URL}/api/auth/register`, {
        data: {
          name: `Gender ${gender}`,
          email: uniqueEmail(),
          password: PASSWORD,
          confirmPassword: PASSWORD,
          age: 24,
          gender,
        },
      });
      expect(response.status(), gender).toBe(201);
    }

    const bogus = await request.post(`${API_URL}/api/auth/register`, {
      data: {
        name: 'Bogus Gender',
        email: uniqueEmail(),
        password: PASSWORD,
        confirmPassword: PASSWORD,
        age: 24,
        gender: 'martian',
      },
    });
    expect(bogus.status()).toBe(400);
  });

  test('the signup form offers every option', async ({ page }) => {
    await page.goto('/register');

    const select = page.getByLabel('Gender');
    await expect(select).toBeVisible();

    const values = await select.locator('option').evaluateAll((options) =>
      options.map((option) => option.value).filter(Boolean)
    );
    expect(values).toEqual(['female', 'male', 'non-binary', 'other', 'prefer-not-to-say']);
  });
});

test.describe('avatars', () => {
  test('a real image uploads, is served, and replaces cleanly', async ({ request }) => {
    const me = await registerViaApi(request);

    const first = await uploadAvatar(request, me.token, TINY_PNG, 'me.png', 'image/png');
    expect(first.status()).toBe(200);
    const url = (await first.json()).data.avatar.url;
    expect(url).toBeTruthy();

    const served = await request.get(`${API_URL}${url}`);
    expect(served.status()).toBe(200);

    const second = await uploadAvatar(request, me.token, TINY_PNG, 'again.png', 'image/png');
    expect(second.status()).toBe(200);

    // The replaced file is gone, not orphaned.
    const stale = await request.get(`${API_URL}${url}`);
    expect(stale.status()).toBe(404);
  });

  test('a file that is not really an image is refused', async ({ request }) => {
    const me = await registerViaApi(request);

    const response = await uploadAvatar(request, me.token, FAKE_IMAGE, 'sneaky.jpg', 'image/jpeg');
    expect(response.status()).toBe(400);
    expect((await response.json()).message).toContain('not a JPEG, PNG or WebP');
  });

  test('an oversized image is refused', async ({ request }) => {
    const me = await registerViaApi(request);

    const response = await uploadAvatar(
      request,
      me.token,
      Buffer.alloc(6 * 1024 * 1024, 1),
      'big.png',
      'image/png'
    );
    expect(response.status()).toBe(400);
  });

  test('removing a photo clears it completely', async ({ request }) => {
    const me = await registerViaApi(request);
    await uploadAvatar(request, me.token, TINY_PNG, 'me.png', 'image/png');

    const removed = await request.delete(`${API_URL}/api/auth/me/avatar`, {
      headers: { Authorization: `Bearer ${me.token}` },
    });
    expect(removed.status()).toBe(200);

    const after = await request.get(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${me.token}` },
    });
    // An empty object here would read as "has a photo" everywhere downstream.
    expect((await after.json()).data.user.avatar).toBeFalsy();
  });

  test('the edit page saves a bio and interests', async ({ page, request }) => {
    // Several round trips on a server that is busy hashing passwords for the
    // rest of the suite.
    test.slow();
    const me = await registerViaApi(request, { name: 'Editor Person' });
    await signIn(page, me.token);

    await page.goto('/profile');
    await page.getByRole('link', { name: 'Edit profile' }).click();
    await expect(page).toHaveURL(/\/profile\/edit$/);

    await page.getByLabel('Bio').fill('Two lines about me.');
    await page.getByLabel('Add an interest').fill('bouldering');
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByText('bouldering')).toBeVisible();

    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Profile saved')).toBeVisible();

    // Persisted, not just held in component state.
    const saved = await request.get(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${me.token}` },
    });
    const savedUser = (await saved.json()).data.user;
    expect(savedUser.bio).toBe('Two lines about me.');
    expect(savedUser.interests).toContain('bouldering');

    // And rendered. Wait for the profile to finish loading first, otherwise
    // this races the loading skeleton on a busy server.
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: me.name })).toBeVisible();
    await expect(page.getByText('Two lines about me.')).toBeVisible();
    await expect(page.getByText('bouldering')).toBeVisible();
  });
});
