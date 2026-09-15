const EARTH_RADIUS_KM = 6371;

/**
 * Coordinates are stored GeoJSON-style: [longitude, latitude].
 *
 * Getting that order wrong is the classic bug here — everyone ends up in the
 * wrong hemisphere and every query silently returns nothing — so read and write
 * them only through these helpers.
 */
const toPoint = (longitude, latitude) => ({
  type: 'Point',
  coordinates: [longitude, latitude],
  updatedAt: new Date(),
});

const hasPoint = (location) =>
  Array.isArray(location?.coordinates) && location.coordinates.length === 2;

const longitudeOf = (location) => (hasPoint(location) ? location.coordinates[0] : null);
const latitudeOf = (location) => (hasPoint(location) ? location.coordinates[1] : null);

const isValidLongitude = (value) => Number.isFinite(value) && value >= -180 && value <= 180;
const isValidLatitude = (value) => Number.isFinite(value) && value >= -90 && value <= 90;

const toRadians = (degrees) => (degrees * Math.PI) / 180;

/** Great-circle distance in kilometres between two GeoJSON points. */
function distanceKm(a, b) {
  if (!hasPoint(a) || !hasPoint(b)) return null;

  const [lonA, latA] = a.coordinates;
  const [lonB, latB] = b.coordinates;

  const dLat = toRadians(latB - latA);
  const dLon = toRadians(lonB - lonA);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(latA)) * Math.cos(toRadians(latB)) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * What another member is allowed to see.
 *
 * Precise short distances let someone triangulate a home address, so anything
 * under 2 km is reported as a band rather than a number.
 */
function displayDistance(km) {
  if (km === null || km === undefined) return null;
  if (km < 2) return { km: null, label: 'Under 2 km' };
  if (km < 10) return { km: Math.round(km), label: `${Math.round(km)} km away` };
  if (km < 100) return { km: Math.round(km / 5) * 5, label: `${Math.round(km / 5) * 5} km away` };

  const rounded = Math.round(km / 10) * 10;
  return { km: rounded, label: `${rounded} km away` };
}

module.exports = {
  toPoint,
  hasPoint,
  longitudeOf,
  latitudeOf,
  isValidLongitude,
  isValidLatitude,
  distanceKm,
  displayDistance,
  EARTH_RADIUS_KM,
};
