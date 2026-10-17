import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { config } from '../config.js';

const MAX_FILE_SIZE = 2 * 1024 * 1024;
// A fixed allowlist: the extension comes from here, never from the client's mimetype or filename.
const EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

// Uploads live under <DATA_DIR>/uploads/{posts,users} and are served at /uploads (see app.js).
export const uploadsRoot = () => path.join(config.DATA_DIR, 'uploads');
const KINDS = ['posts', 'users'];
const uploadDir = (subdir) => path.join(uploadsRoot(), subdir);

// Creates the upload folders (also a fresh DATA_DIR on first start). Safe to call repeatedly.
export const ensureUploadDirs = () => {
  for (const kind of KINDS) fs.mkdirSync(uploadDir(kind), { recursive: true });
};

// Returns single-file multer middleware for `field`, storing under <subdir> with a random file name.
export const makeUpload = ({ subdir, prefix, field }) => {
  const storage = multer.diskStorage({
    // mkdir here too: the folder may have been removed since start (for example by seed --reset)
    destination: (req, file, cb) => {
      const dir = uploadDir(subdir);
      fs.mkdir(dir, { recursive: true }, (err) => cb(err, dir));
    },
    filename: (req, file, cb) => {
      // Random name: nothing guessable (user id, timestamp) and nothing taken from the client
      cb(null, `${prefix}-${crypto.randomBytes(16).toString('hex')}.${EXTENSIONS[file.mimetype]}`);
    },
  });
  const fileFilter = (req, file, cb) => {
    if (EXTENSIONS[file.mimetype]) return cb(null, true);
    // A real Error with a status, so the JSON error handler answers 400 instead of a bare 500
    const err = new Error('Only JPEG, PNG or WebP images are allowed.');
    err.status = 400;
    err.expose = true;
    cb(err, false);
  };
  return multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE, files: 1 } }).single(
    field,
  );
};

// Deletes a previously stored upload. Never touches default.jpg, and path.basename keeps a stored value
// like "../x" from escaping the folder. A file that is already gone is not an error.
export const removeStoredFile = async (subdir, filename) => {
  if (!filename || filename === 'default.jpg') return;
  try {
    await fs.promises.unlink(path.join(uploadDir(subdir), path.basename(filename)));
  } catch (err) {
    if (err.code !== 'ENOENT') console.error(err);
  }
};
