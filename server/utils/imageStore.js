const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const LOCAL_DIR = path.join(__dirname, '..', 'uploads');

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// Accepted types, with the magic bytes that actually prove them. A client can
// claim any MIME type it likes, so the signature is what we trust.
const SIGNATURES = [
  { type: 'image/jpeg', ext: 'jpg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    type: 'image/png',
    ext: 'png',
    test: (b) =>
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d &&
      b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  },
  {
    type: 'image/webp',
    ext: 'webp',
    test: (b) =>
      b.slice(0, 4).toString('ascii') === 'RIFF' && b.slice(8, 12).toString('ascii') === 'WEBP',
  },
];

class ImageError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

/**
 * Decides what a buffer really is. Returns null when it is not an image we
 * accept, whatever the upload claimed.
 */
function detectType(buffer) {
  if (!buffer || buffer.length < 12) return null;
  return SIGNATURES.find((signature) => signature.test(buffer)) || null;
}

function storeName() {
  if (process.env.IMAGE_STORE) return process.env.IMAGE_STORE;
  return process.env.CLOUDINARY_CLOUD_NAME ? 'cloudinary' : 'local';
}

/* -- local ------------------------------------------------------------ */

function saveLocal(buffer, ext) {
  fs.mkdirSync(LOCAL_DIR, { recursive: true });

  const id = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
  const filename = `${id}.${ext}`;
  fs.writeFileSync(path.join(LOCAL_DIR, filename), buffer);

  return { url: `/uploads/${filename}`, publicId: `local:${filename}` };
}

function removeLocal(publicId) {
  const filename = publicId.replace(/^local:/, '');
  // Never let a stored id escape the uploads folder.
  if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) return;

  try {
    fs.unlinkSync(path.join(LOCAL_DIR, filename));
  } catch {
    /* already gone */
  }
}

/* -- cloudinary ------------------------------------------------------- */

async function saveCloudinary(buffer, type) {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;

  if (!cloud || !key || !secret) {
    throw new ImageError('Image uploads are not configured on this server', 500);
  }

  const timestamp = Math.floor(Date.now() / 1000);
  // Square 512 thumbnail, so a grid never pulls down full-size originals.
  const params = { folder: 'buddyfi/avatars', timestamp, transformation: 'c_fill,g_face,h_512,w_512' };

  const toSign = Object.keys(params)
    .sort()
    .map((name) => `${name}=${params[name]}`)
    .join('&');
  const signature = crypto.createHash('sha1').update(toSign + secret).digest('hex');

  const form = new FormData();
  form.append('file', new Blob([buffer], { type }));
  form.append('api_key', key);
  for (const [name, value] of Object.entries(params)) form.append(name, String(value));
  form.append('signature', signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
    method: 'POST',
    body: form,
  });

  if (!response.ok) {
    throw new ImageError(`Image host rejected the upload (${response.status})`, 502);
  }

  const body = await response.json();
  return { url: body.secure_url, publicId: body.public_id };
}

async function removeCloudinary(publicId) {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret) return;

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto
    .createHash('sha1')
    .update(`public_id=${publicId}&timestamp=${timestamp}${secret}`)
    .digest('hex');

  const form = new FormData();
  form.append('public_id', publicId);
  form.append('api_key', key);
  form.append('timestamp', String(timestamp));
  form.append('signature', signature);

  await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/destroy`, {
    method: 'POST',
    body: form,
  }).catch(() => {
    /* a failed cleanup must not fail the request that replaced the image */
  });
}

/* -- public ----------------------------------------------------------- */

/**
 * Validates and stores one image.
 * @returns {{ url: string, publicId: string }}
 */
async function saveImage(buffer) {
  if (!buffer || buffer.length === 0) {
    throw new ImageError('No image was uploaded');
  }
  if (buffer.length > MAX_BYTES) {
    throw new ImageError('Images must be 5 MB or smaller');
  }

  const detected = detectType(buffer);
  if (!detected) {
    throw new ImageError('That file is not a JPEG, PNG or WebP image');
  }

  return storeName() === 'cloudinary'
    ? saveCloudinary(buffer, detected.type)
    : saveLocal(buffer, detected.ext);
}

/** Best-effort removal of a previously stored image. */
async function deleteImage(publicId) {
  if (!publicId) return;

  if (publicId.startsWith('local:')) return removeLocal(publicId);
  return removeCloudinary(publicId);
}

module.exports = {
  saveImage,
  deleteImage,
  detectType,
  storeName,
  ImageError,
  LOCAL_DIR,
  MAX_BYTES,
};
