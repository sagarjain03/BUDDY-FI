const test = require('node:test');
const assert = require('node:assert/strict');

const {
  toPoint,
  hasPoint,
  longitudeOf,
  latitudeOf,
  isValidLongitude,
  isValidLatitude,
  distanceKm,
  displayDistance,
} = require('../utils/geo');

// Real places, so a wrong coordinate order shows up as an absurd distance
// rather than a plausible one.
const DELHI = toPoint(77.209, 28.6139);
const MUMBAI = toPoint(72.8777, 19.076);
const LONDON = toPoint(-0.1276, 51.5072);

test('a point stores coordinates as [longitude, latitude]', () => {
  const point = toPoint(77.209, 28.6139);

  assert.equal(point.type, 'Point');
  assert.deepEqual(point.coordinates, [77.209, 28.6139]);
  assert.equal(longitudeOf(point), 77.209);
  assert.equal(latitudeOf(point), 28.6139);
  assert.ok(point.updatedAt instanceof Date);
});

test('distance between Delhi and Mumbai is about 1150 km', () => {
  const km = distanceKm(DELHI, MUMBAI);
  assert.ok(km > 1100 && km < 1200, `expected ~1150 km, got ${Math.round(km)}`);
});

test('distance between Delhi and London is about 6700 km', () => {
  const km = distanceKm(DELHI, LONDON);
  assert.ok(km > 6600 && km < 6800, `expected ~6700 km, got ${Math.round(km)}`);
});

test('swapping longitude and latitude gives a visibly wrong answer', () => {
  // The whole point of the helpers: this is what the bug looks like.
  const swapped = toPoint(28.6139, 77.209);
  const km = distanceKm(swapped, MUMBAI);

  assert.ok(km > 3000, 'a swapped pair should not look like a plausible distance');
});

test('distance is symmetric and zero to itself', () => {
  assert.equal(Math.round(distanceKm(DELHI, MUMBAI)), Math.round(distanceKm(MUMBAI, DELHI)));
  assert.equal(Math.round(distanceKm(DELHI, DELHI)), 0);
});

test('a missing point yields null rather than throwing', () => {
  assert.equal(distanceKm(null, MUMBAI), null);
  assert.equal(distanceKm(DELHI, undefined), null);
  assert.equal(distanceKm({ type: 'Point' }, MUMBAI), null);
  assert.equal(hasPoint(undefined), false);
  assert.equal(hasPoint({ coordinates: [1] }), false);
});

test('coordinate ranges are validated', () => {
  assert.equal(isValidLongitude(180), true);
  assert.equal(isValidLongitude(-180), true);
  assert.equal(isValidLongitude(181), false);
  assert.equal(isValidLatitude(90), true);
  assert.equal(isValidLatitude(-91), false);
  assert.equal(isValidLatitude(Number.NaN), false);
  assert.equal(isValidLongitude('77'), false);
});

test('short distances are banded, never reported precisely', () => {
  // A precise 300 m would help someone find a home address.
  assert.deepEqual(displayDistance(0.3), { km: null, label: 'Under 2 km' });
  assert.deepEqual(displayDistance(1.9), { km: null, label: 'Under 2 km' });
});

test('longer distances get coarser as they grow', () => {
  assert.equal(displayDistance(7.4).label, '7 km away');
  assert.equal(displayDistance(42).label, '40 km away');
  assert.equal(displayDistance(137).label, '140 km away');
});

test('an unknown distance stays unknown', () => {
  assert.equal(displayDistance(null), null);
  assert.equal(displayDistance(undefined), null);
});
