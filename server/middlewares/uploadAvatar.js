const multer = require('multer');
const { MAX_BYTES } = require('../utils/imageStore');

/**
 * Holds the upload in memory so it can be checked before anything is written.
 * The size cap is enforced here and again in the image store; the real type
 * check happens in the store, from the file's own bytes.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
});

const single = upload.single('avatar');

exports.avatarUpload = (req, res, next) =>
  single(req, res, (err) => {
    if (!err) return next();

    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ status: 'error', message: 'Images must be 5 MB or smaller' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res
        .status(400)
        .json({ status: 'error', message: 'Send the image in a field named "avatar"' });
    }

    console.error('avatar upload failed:', err);
    return res.status(400).json({ status: 'error', message: 'Could not read that upload' });
  });
