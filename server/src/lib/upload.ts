import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { IMAGE_MIME_TYPES, MAX_IMAGE_BYTES } from '@mern-blog/shared';
import type { ImageMimeType } from '@mern-blog/shared';
import type { RequestHandler } from 'express';
import multer from 'multer';
import { config } from '../config.js';
import { errorCode, HttpError } from './errors.js';

// A fixed allowlist: the extension comes from here, never from the client's mimetype or filename.
// The accepted types are the shared list; this adds the extension each one is stored under.
const EXTENSIONS: Record<ImageMimeType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

// The extension for an allowed image type, or undefined for anything else. Looking the type up in
// the list (not in the map) keeps a client-chosen string from ever reaching the map as a key.
const extensionOf = (mimetype: string): string | undefined => {
  const type = IMAGE_MIME_TYPES.find((allowed) => allowed === mimetype);
  return type && EXTENSIONS[type];
};

// Uploads live under <DATA_DIR>/uploads/{posts,users} and are served at /uploads (see app.ts).
export const uploadsRoot = (): string => path.join(config.DATA_DIR, 'uploads');
const KINDS = ['posts', 'users'] as const;
export type UploadKind = (typeof KINDS)[number];
const uploadDir = (subdir: UploadKind): string => path.join(uploadsRoot(), subdir);

// Creates the upload folders (also a fresh DATA_DIR on first start). Safe to call repeatedly.
export const ensureUploadDirs = (): void => {
  for (const kind of KINDS) fs.mkdirSync(uploadDir(kind), { recursive: true });
};

const notAnImage = () =>
  // A real Error with a status, so the JSON error handler answers 400 instead of a bare 500
  new HttpError(400, 'Only JPEG, PNG or WebP images are allowed.', true);

// Returns single-file multer middleware for `field`, storing under <subdir> with a random file name.
export const makeUpload = ({
  subdir,
  prefix,
  field,
}: {
  subdir: UploadKind;
  prefix: string;
  field: string;
}): RequestHandler => {
  const storage = multer.diskStorage({
    // mkdir here too: the folder may have been removed since start (for example by seed --reset)
    destination: (_req, _file, cb) => {
      const dir = uploadDir(subdir);
      fs.mkdir(dir, { recursive: true }, (err) => {
        cb(err, dir);
      });
    },
    filename: (_req, file, cb) => {
      const extension = extensionOf(file.mimetype);
      if (extension === undefined) {
        // fileFilter has already turned these away; this only keeps "undefined" out of a file name.
        cb(notAnImage(), '');
        return;
      }
      // Random name: nothing guessable (user id, timestamp) and nothing taken from the client
      cb(null, `${prefix}-${crypto.randomBytes(16).toString('hex')}.${extension}`);
    },
  });
  const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
    if (extensionOf(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(notAnImage());
  };
  return multer({ storage, fileFilter, limits: { fileSize: MAX_IMAGE_BYTES, files: 1 } }).single(
    field,
  );
};

// Deletes a previously stored upload. Never touches default.jpg, and path.basename keeps a stored value
// like "../x" from escaping the folder. A file that is already gone is not an error.
export const removeStoredFile = async (
  subdir: UploadKind,
  filename: string | null | undefined,
): Promise<void> => {
  if (!filename || filename === 'default.jpg') return;
  try {
    await fs.promises.unlink(path.join(uploadDir(subdir), path.basename(filename)));
  } catch (err) {
    if (errorCode(err) !== 'ENOENT') console.error(err);
  }
};
