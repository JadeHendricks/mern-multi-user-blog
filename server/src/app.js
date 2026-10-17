import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { createMailer } from './lib/mailer.js';
import { CLIENT_BUILD_DIR } from './lib/paths.js';
import { ensureUploadDirs, uploadsRoot } from './lib/upload.js';
import { createAuthController } from './modules/auth/controller.js';
import { createUserController } from './modules/users/controller.js';
import { createPostController } from './modules/posts/controller.js';
import createAuthRouter from './modules/auth/routes.js';
import createUserRouter from './modules/users/routes.js';
import createPostRouter from './modules/posts/routes.js';
import { DuplicateEmailError, InvalidCursorError, StoreValidationError } from './store/errors.js';

// The app only knows the repo interface (see store/types.ts), never a database driver,
// so any storage adapter can be plugged in. Mail goes through mailer.send the same way.
export function createApp({ store, mailer = createMailer(config) }) {
    const app = express();

    //Middleware
    // Request logging is a development aid; tests and production stay quiet.
    if (config.NODE_ENV === 'development') app.use(morgan('dev'));
    app.use(helmet({
        // Explicit policy so a helmet upgrade cannot change it silently. 'unsafe-inline' is for styles only:
        // CRA and react-toastify inject <style> tags. Google Fonts hosts stay until Lato is self-hosted.
        contentSecurityPolicy: {
            useDefaults: false,
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
                fontSrc: ["'self'", 'https://fonts.gstatic.com'],
                imgSrc: ["'self'", 'data:', 'blob:'],
                connectSrc: ["'self'"],
                objectSrc: ["'none'"],
                frameAncestors: ["'none'"],
                baseUri: ["'self'"],
                ...(config.NODE_ENV === 'production' ? { upgradeInsecureRequests: [] } : {})
            }
        },
        // Uploaded images are served to the client dev server on another port (:3000 -> :5000).
        crossOriginResourcePolicy: { policy: 'same-site' }
    }));
    if (config.NODE_ENV === 'development') { app.use(cors({ origin: `http://localhost:3000` })) }

    const limiter = rateLimit({
        limit: 1000,
        windowMs: 60 * 60 * 1000,
        message: 'Too many requests from this IP, please try again in an hour!'
    });

    app.use('/api', limiter);
    app.use(express.json({ limit: '10kb' }));
    app.use(express.urlencoded({ extended: true, limit: '10kb' }));
    app.use(cookieParser());
    // Express 5 leaves req.body undefined when nothing was parsed; handlers destructure it.
    app.use((req, res, next) => {
        req.body ??= {};
        next();
    });

    const auth = createAuthController({ store, mailer });
    app.use('/api/auth', createAuthRouter({ auth }));
    app.use('/api/user', createUserRouter({ auth, user: createUserController({ store }) }));
    app.use('/api/post', createPostRouter({ auth, post: createPostController({ store }) }));

    // Uploaded images. default.jpg is NOT here: it is a bundled client asset. File names are random and
    // never change (a replaced image gets a new name), so they can be cached for a long time.
    // Registered before the /api 404 and the production catch-all so a missing file stays a 404.
    ensureUploadDirs();
    app.use('/uploads', express.static(uploadsRoot(), {
        index: false,
        redirect: false,
        dotfiles: 'ignore',
        maxAge: '30d',
        immutable: true,
        fallthrough: true,
        setHeaders: (res) => res.set('X-Content-Type-Options', 'nosniff')
    }));
    app.use('/uploads', (req, res) => {
        res.status(404).json({ message: 'Not found' });
    });

    // Unknown API paths answer JSON; without this the production catch-all below would return index.html
    app.use('/api', (req, res) => {
        res.status(404).json({ message: 'Not found' });
    });

    // JSON error handler. Must keep the 4-argument signature so Express treats it as an error middleware.
    app.use((err, req, res, next) => {
        if (res.headersSent) return next(err);
        if (err.name === 'MulterError') {
            const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
            return res.status(status).json({ message: err.message });
        }
        // Store errors are the caller's input problems, not crashes: answer with the store's own message.
        if (err instanceof DuplicateEmailError) return res.status(409).json({ message: err.message });
        if (err instanceof InvalidCursorError) return res.status(422).json({ message: err.message });
        if (err instanceof StoreValidationError) return res.status(422).json({ message: err.message });

        // body-parser and similar errors carry a 4xx status (e.g. malformed JSON, payload too large)
        const status = err.status || err.statusCode;
        if (status >= 400 && status < 500) {
            return res.status(status).json({ message: err.expose ? err.message : 'Bad request' });
        }
        console.error(err);
        res.status(500).json({ message: 'Something went wrong' });
    });

    if (config.NODE_ENV === 'production') {
        app.use(express.static(CLIENT_BUILD_DIR));
        app.get('/{*splat}', (req, res) => {
            res.sendFile(path.join(CLIENT_BUILD_DIR, 'index.html'))
        });
    }

    return app;
}
