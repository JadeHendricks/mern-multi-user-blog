import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { createAuthController } from './controllers/authController.js';
import { createUserController } from './controllers/userController.js';
import { createPostController } from './controllers/postController.js';
import createAuthRouter from './routes/authRoute.js';
import createUserRouter from './routes/userRoute.js';
import createPostRouter from './routes/postRoute.js';

// The app only knows the repo interface (see store/types.js), never a database driver,
// so any storage adapter can be plugged in.
export function createApp({ store }) {
    const app = express();

    //Middleware
    app.use(morgan('dev'));
    app.use(helmet());
    if (config.NODE_ENV === 'development') { app.use(cors({ origin: `http://localhost:3000` })) }

    const limiter = rateLimit({
        max: 1000,
        windowMs: 60 * 60 * 1000,
        message: 'Too many requests from this IP, please try again in an hour!'
    });

    app.use('/api', limiter);
    app.use(express.json({ limit: '10kb' }));
    app.use(express.urlencoded({ extended: true, limit: '10kb' }));
    app.use(cookieParser());
    app.use(mongoSanitize());
    app.use(xss());
    //Add a whitelist option if you allow duplicate parameters
    app.use(hpp());

    const auth = createAuthController({ store });
    app.use('/api/auth', createAuthRouter({ auth }));
    app.use('/api/user', createUserRouter({ auth, user: createUserController({ store }) }));
    app.use('/api/post', createPostRouter({ auth, post: createPostController({ store }) }));

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
        // body-parser and similar errors carry a 4xx status (e.g. malformed JSON, payload too large)
        const status = err.status || err.statusCode;
        if (status >= 400 && status < 500) {
            return res.status(status).json({ message: err.expose ? err.message : 'Bad request' });
        }
        console.error(err);
        res.status(500).json({ message: 'Something went wrong' });
    });

    if (config.NODE_ENV === 'production') {
        const clientBuild = path.resolve(import.meta.dirname, '../../client/build');
        app.use(express.static(clientBuild));
        app.get('*', (req, res) => {
            res.sendFile(path.join(clientBuild, 'index.html'))
        });
    }

    return app;
}
