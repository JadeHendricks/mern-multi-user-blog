const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const MAX_FILE_SIZE = 2 * 1024 * 1024;
// A fixed allowlist: the extension comes from here, never from the client's mimetype or filename.
const EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

// Same destination logic as before: UPLOAD_DIR/<subdir> when set, otherwise the client assets folder.
const uploadDir = (subdir) =>
    process.env.UPLOAD_DIR ? path.join(process.env.UPLOAD_DIR, subdir) : `client/src/assets/images/${subdir}`;

// Returns single-file multer middleware for `field`, storing under <subdir> with a random file name.
exports.makeUpload = ({ subdir, prefix, field }) => {
    const storage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, uploadDir(subdir)),
        filename: (req, file, cb) => {
            // Random name: nothing guessable (user id, timestamp) and nothing taken from the client
            cb(null, `${prefix}-${crypto.randomBytes(16).toString('hex')}.${EXTENSIONS[file.mimetype]}`);
        }
    });
    const fileFilter = (req, file, cb) => {
        if (EXTENSIONS[file.mimetype]) return cb(null, true);
        // A real Error with a status, so the JSON error handler answers 400 instead of a bare 500
        const err = new Error('Only JPEG, PNG or WebP images are allowed.');
        err.status = 400;
        err.expose = true;
        cb(err, false);
    };
    return multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE, files: 1 } }).single(field);
};

// Deletes a previously stored upload. Never touches default.jpg, and path.basename keeps a stored value
// like "../x" from escaping the folder. A file that is already gone is not an error.
exports.removeStoredFile = async (subdir, filename) => {
    if (!filename || filename === 'default.jpg') return;
    try {
        await fs.promises.unlink(path.join(uploadDir(subdir), path.basename(filename)));
    } catch (err) {
        if (err.code !== 'ENOENT') console.error(err);
    }
};
