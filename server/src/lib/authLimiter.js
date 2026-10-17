import rateLimit from 'express-rate-limit';

// One limiter instance per route: each has its own counter, so failed logins do not eat
// into someone's register or reset attempts. The cap is read on every request so tests
// (and the local E2E server) can raise or lower it through AUTH_RATE_LIMIT_MAX.
const authLimiter = () => rateLimit({
    windowMs: 15 * 60 * 1000,
    max: () => Number(process.env.AUTH_RATE_LIMIT_MAX) || 10,
    handler: (req, res) => {
        res.status(429).json({
            message: 'Too many attempts, please try again in 15 minutes.'
        });
    }
});

export default authLimiter;