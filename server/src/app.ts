import path from 'node:path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import type { Express, NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import type { MulterError } from 'multer';
import { config } from './config.js';
import { errorMessage } from './lib/errors.js';
import { createMailer } from './lib/mailer.js';
import type { Mailer } from './lib/mailer.js';
import { CLIENT_DIST_DIR } from './lib/paths.js';
import { ensureUploadDirs, uploadsRoot } from './lib/upload.js';
import { createAuthController } from './modules/auth/controller.js';
import createAuthRouter from './modules/auth/routes.js';
import { createPostController } from './modules/posts/controller.js';
import createPostRouter from './modules/posts/routes.js';
import { createUserController } from './modules/users/controller.js';
import createUserRouter from './modules/users/routes.js';
import { DuplicateEmailError, InvalidCursorError, StoreValidationError } from './store/errors.js';
import type { Store } from './store/types.js';

// multer raises its own error class; the name is what the JSON handler below keys on.
const isMulterError = (err: unknown): err is MulterError =>
  err instanceof Error && err.name === 'MulterError';

// body-parser and similar errors carry a 4xx `status` (or `statusCode`) and an `expose` flag that
// says whether the message is safe to show. Anything else has neither.
const httpStatus = (err: unknown): number | undefined => {
  if (typeof err !== 'object' || err === null) return undefined;
  const { status, statusCode } = err as { status?: unknown; statusCode?: unknown };
  if (typeof status === 'number' && status) return status;
  if (typeof statusCode === 'number') return statusCode;
  return undefined;
};
const isExposed = (err: unknown): boolean =>
  typeof err === 'object' && err !== null && 'expose' in err && Boolean(err.expose);

// The app only knows the repo interface (see store/types.ts), never a database driver,
// so any storage adapter can be plugged in. Mail goes through mailer.send the same way.
export function createApp({
  store,
  mailer = createMailer(config),
  clientDir = CLIENT_DIST_DIR,
  serveClient = config.NODE_ENV === 'production',
}: {
  store: Store;
  mailer?: Mailer;
  // Overridable so tests can serve a temp folder; production uses client/dist.
  clientDir?: string;
  serveClient?: boolean;
}): Express {
  const app = express();

  //Middleware
  // Request logging is a development aid; tests and production stay quiet.
  if (config.NODE_ENV === 'development') app.use(morgan('dev'));
  app.use(
    helmet({
      // Explicit policy so a helmet upgrade cannot change it silently. 'unsafe-inline' is for styles only:
      // react-toastify injects <style> tags. The Vite build has no inline scripts. Lato is self-hosted
      // (@fontsource/lato), so no third-party style or font hosts are allowed.
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          fontSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
          ...(config.NODE_ENV === 'production' ? { upgradeInsecureRequests: [] } : {}),
        },
      },
      // Uploaded images are served to the client dev server on another port (:3000 -> :5000).
      crossOriginResourcePolicy: { policy: 'same-site' },
    }),
  );
  if (config.NODE_ENV === 'development') {
    app.use(cors({ origin: `http://localhost:3000` }));
  }

  const limiter = rateLimit({
    limit: 1000,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again in an hour!',
  });
  app.use('/api', limiter);

  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  app.use(cookieParser());

  // Express 5 leaves req.body undefined when nothing was parsed; handlers destructure it.
  app.use((req: Request, _res: Response, next: NextFunction) => {
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
  app.use(
    '/uploads',
    express.static(uploadsRoot(), {
      index: false,
      redirect: false,
      dotfiles: 'ignore',
      maxAge: '30d',
      immutable: true,
      fallthrough: true,
      setHeaders: (res) => res.set('X-Content-Type-Options', 'nosniff'),
    }),
  );
  app.use('/uploads', (_req, res) => {
    res.status(404).json({ message: 'Not found' });
  });

  // Unknown API paths answer JSON; without this the production catch-all below would return index.html
  app.use('/api', (_req, res) => {
    res.status(404).json({ message: 'Not found' });
  });

  // JSON error handler. Must keep the 4-argument signature so Express treats it as an error middleware.
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      next(err);
      return;
    }
    if (isMulterError(err)) {
      const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      res.status(status).json({ message: err.message });
      return;
    }
    // Store errors are the caller's input problems, not crashes: answer with the store's own message.
    if (err instanceof DuplicateEmailError) {
      res.status(409).json({ message: err.message });
      return;
    }
    if (err instanceof InvalidCursorError || err instanceof StoreValidationError) {
      res.status(422).json({ message: err.message });
      return;
    }
    // body-parser and similar errors carry a 4xx status (e.g. malformed JSON, payload too large)
    const status = httpStatus(err);
    if (status !== undefined && status >= 400 && status < 500) {
      res.status(status).json({ message: isExposed(err) ? errorMessage(err) : 'Bad request' });
      return;
    }
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  });

  if (serveClient) {
    // Vite emits content-hashed files under assets/, so they can be cached forever. index.html is
    // the entry that points at them and must be revalidated on every load.
    app.use(
      express.static(clientDir, {
        index: false,
        setHeaders: (res, filePath) => {
          const rel = path.relative(clientDir, filePath).split(path.sep);
          if (rel[0] === 'assets') res.set('Cache-Control', 'public, max-age=31536000, immutable');
        },
      }),
    );
    // SPA fallback: only for page loads (GET/HEAD). /api and /uploads misses were answered above.
    app.use((req, res, next) => {
      // A missing hashed asset should stay a 404, not turn into HTML that fails to parse as a script.
      if ((req.method !== 'GET' && req.method !== 'HEAD') || req.path.startsWith('/assets/')) {
        next();
        return;
      }
      res.set('Cache-Control', 'no-cache');
      res.sendFile(path.join(clientDir, 'index.html'), (err) => {
        if (err) next(err);
      });
    });
  }
  return app;
}
