import { test, expect } from '@playwright/test';
import { API_URL, registerViaApi, submitAnswers, signIn, ALL_ANSWERS } from './helpers';

// Real places, so a swapped coordinate pair shows up as an absurd distance.
const DELHI = { longitude: 77.209, latitude: 28.6139 };
const DELHI_NEARBY = { longitude: 77.22, latitude: 28.68 }; // ~7 km
const GURGAON = { longitude: 77.0266, latitude: 28.4595 }; // ~25 km
const MUMBAI = { longitude: 72.8777, latitude: 19.076 }; // ~1150 km
const NEXT_DOOR = { longitude: 77.2095, latitude: 28.6142 }; // a few hundred metres

const setLocation = (request, token, coords) =>
  request.post(`${API_URL}/api/auth/update-location`, {
    headers: { Authorization: `Bearer ${token}` },
    data: coords,
  });

/** A verified member with answers, optionally placed on the map. */
async function member(request, name, coords) {
  const account = await registerViaApi(request, { name });
  await submitAnswers(request, account.token, ALL_ANSWERS);
  if (coords) await setLocation(request, account.token, coords);
  return account;
}

const discover = async (request, token, query = '') => {
  const response = await request.get(`${API_URL}/api/discover?limit=50${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return { body: await response.json(), text: await response.text() };
};

const distanceTo = (body, name) =>
  body.data.matches.find((entry) => entry.user.name === name)?.distance ?? null;

test.describe('distance', () => {
  test('distances are plausible, which proves the coordinate order', async ({ request }) => {
    const near = await member(request, 'Prox Near', DELHI_NEARBY);
    const mid = await member(request, 'Prox Mid', GURGAON);
    const far = await member(request, 'Prox Far', MUMBAI);
    const me = await member(request, 'Prox Viewer', DELHI);

    const { body } = await discover(request, me.token);

    // Delhi to Mumbai really is about 1150 km. A swapped pair would not be.
    expect(distanceTo(body, far.name).km).toBeGreaterThan(1000);
    expect(distanceTo(body, far.name).km).toBeLessThan(1300);

    expect(distanceTo(body, near.name).km).toBeLessThan(15);
    expect(distanceTo(body, mid.name).km).toBeGreaterThan(distanceTo(body, near.name).km);
  });

  test('anything under 2 km is banded, never given precisely', async ({ request }) => {
    const neighbour = await member(request, 'Prox Neighbour', NEXT_DOOR);
    const me = await member(request, 'Prox Local', DELHI);

    const { body } = await discover(request, me.token);
    const distance = distanceTo(body, neighbour.name);

    expect(distance.label).toBe('Under 2 km');
    expect(distance.km, 'a precise short distance would locate a home').toBeNull();
  });

  test('no response ever carries another member coordinates', async ({ request }) => {
    await member(request, 'Prox Hidden Coords', DELHI_NEARBY);
    const me = await member(request, 'Prox Snooper', DELHI);

    const { text } = await discover(request, me.token);

    expect(text).not.toContain('"coordinates"');
    expect(text).not.toContain('"longitude"');
    expect(text).not.toContain('"latitude"');
  });

  test('the caller can still see their own coordinates', async ({ request }) => {
    const me = await member(request, 'Prox Self', DELHI);

    const response = await request.get(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${me.token}` },
    });
    const user = (await response.json()).data.user;

    expect(user.location.longitude).toBeCloseTo(DELHI.longitude, 3);
    expect(user.location.latitude).toBeCloseTo(DELHI.latitude, 3);
    expect(user.location.updatedAt).toBeTruthy();
  });
});

test.describe('radius', () => {
  test('a radius narrows the list, and widening it brings people back', async ({ request }) => {
    const near = await member(request, 'Rad Near', DELHI_NEARBY);
    const far = await member(request, 'Rad Far', MUMBAI);
    const me = await member(request, 'Rad Viewer', DELHI);

    const tight = await discover(request, me.token, '&radius=10');
    const names = tight.body.data.matches.map((entry) => entry.user.name);
    expect(names).toContain(near.name);
    expect(names).not.toContain(far.name);

    const wide = await discover(request, me.token, '&radius=2000');
    const wideNames = wide.body.data.matches.map((entry) => entry.user.name);
    expect(wideNames).toContain(near.name);
    expect(wideNames).toContain(far.name);
  });

  test('a caller with no location keeps seeing everyone', async ({ request }) => {
    await member(request, 'Rad Somebody', DELHI);
    const me = await member(request, 'Rad Placeless', null);

    const { body } = await discover(request, me.token, '&radius=5');

    expect(body.hasLocation).toBe(false);
    expect(body.radius, 'a radius without a position must be ignored').toBeNull();
    expect(body.total).toBeGreaterThan(0);
  });

  test('sorting by distance puts the nearest first and the unknown last', async ({ request }) => {
    const near = await member(request, 'Sort Near', DELHI_NEARBY);
    const far = await member(request, 'Sort Far', MUMBAI);
    const nowhere = await member(request, 'Sort Nowhere', null);
    const me = await member(request, 'Sort Viewer', DELHI);

    const { body } = await discover(request, me.token, '&sort=distance');
    const order = body.data.matches.map((entry) => entry.user.name);

    expect(order.indexOf(near.name)).toBeLessThan(order.indexOf(far.name));
    expect(order.indexOf(far.name)).toBeLessThan(order.indexOf(nowhere.name));
  });
});

test.describe('the off switch', () => {
  test('turning sharing off hides the distance and the member from radius searches', async ({
    request,
  }) => {
    const shy = await member(request, 'Shy Member', NEXT_DOOR);
    await request.patch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${shy.token}` },
      data: { shareLocation: false },
    });

    const me = await member(request, 'Shy Viewer', DELHI);

    // Still browsable, just without a distance.
    const all = await discover(request, me.token);
    expect(all.body.data.matches.map((entry) => entry.user.name)).toContain(shy.name);
    expect(distanceTo(all.body, shy.name)).toBeNull();

    // And absent from a proximity search, even though they are next door.
    const nearby = await discover(request, me.token, '&radius=10');
    expect(nearby.body.data.matches.map((entry) => entry.user.name)).not.toContain(shy.name);
  });

  test('clearing a location removes it everywhere', async ({ request }) => {
    const other = await member(request, 'Clear Other', DELHI_NEARBY);
    const me = await member(request, 'Clear Viewer', DELHI);

    expect(distanceTo((await discover(request, me.token)).body, other.name)).not.toBeNull();

    const cleared = await request.delete(`${API_URL}/api/auth/me/location`, {
      headers: { Authorization: `Bearer ${other.token}` },
    });
    expect(cleared.status()).toBe(200);

    const own = await request.get(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${other.token}` },
    });
    expect((await own.json()).data.user.location).toBeFalsy();

    expect(distanceTo((await discover(request, me.token)).body, other.name)).toBeNull();
  });
});

test.describe('validation', () => {
  test('out-of-range and non-numeric coordinates are refused', async ({ request }) => {
    const me = await registerViaApi(request);

    for (const coords of [
      { longitude: 999, latitude: 28 },
      { longitude: 77, latitude: -91 },
      { longitude: 'abc', latitude: 28 },
      { longitude: 77 },
    ]) {
      const response = await setLocation(request, me.token, coords);
      expect(response.status(), JSON.stringify(coords)).toBe(400);
    }
  });
});

test.describe('proximity UI', () => {
  test('a distance appears on the cards and the radius filter works', async ({
    page,
    request,
  }) => {
    await member(request, 'Ui Near', DELHI_NEARBY);
    const far = await member(request, 'Ui Far', MUMBAI);
    const me = await member(request, 'Ui Viewer', DELHI);

    await signIn(page, me.token);
    await page.goto('/show-users');

    // Distances render at all.
    await expect(page.getByText(/km away|Under 2 km/).first()).toBeVisible();

    // The Mumbai member is reachable somewhere in the unfiltered list…
    const total = async () =>
      Number((await page.getByText(/\d+ matches?$/).innerText()).split(' ')[0]);
    const before = await total();

    // …and gone once the radius excludes them, whichever page they were on.
    await page.getByRole('button', { name: '25 km' }).click();
    await expect(page.getByText(`${before} matches`)).toHaveCount(0);

    const after = await total();
    expect(after).toBeLessThan(before);
    await expect(page.locator('article').filter({ hasText: far.name })).toHaveCount(0);
  });

  test('the location page explains what is stored and can forget it', async ({
    page,
    request,
  }) => {
    const me = await member(request, 'Ui Location', DELHI);
    await signIn(page, me.token);

    await page.goto('/location');
    await expect(page.getByText('Your location is saved')).toBeVisible();
    await expect(page.getByText(/Other members never see your/)).toBeVisible();

    await page.getByRole('button', { name: 'Forget my location' }).click();
    await expect(page.getByText('Location cleared.')).toBeVisible();
    await expect(page.getByText('Share your current location')).toBeVisible();
  });
});
