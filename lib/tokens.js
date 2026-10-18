const crypto = require('crypto');

// Opaque random tokens for emailed links. Only the SHA-256 hash is stored, so a leaked
// database row cannot be used as a link.
const hashToken = (raw) => crypto.createHash('sha256').update(String(raw)).digest('hex');

const newToken = () => {
    const raw = crypto.randomBytes(32).toString('hex');
    return { raw, hash: hashToken(raw) };
};

module.exports = { newToken, hashToken };
