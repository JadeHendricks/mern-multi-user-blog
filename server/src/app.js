const express = require('express');
const app = express();
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const path = require('path');
const rateLimit = require('express-rate-limit');
const authRouter = require('./routes/authRoute');
const userRouter = require('./routes/userRoute');
const postRouter = require('./routes/postRoute');

//Middleware
app.use(morgan('dev'));
app.use(helmet());
if (process.env.NODE_ENV === 'development') { app.use(cors({ origin: `http://localhost:3000` })) }

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

app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/post', postRouter);

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

if (process.env.NODE_ENV === 'production') {
   const clientBuild = path.resolve(__dirname, '../../client/build');
   app.use(express.static(clientBuild));
   app.get('*', (req, res) => {
      res.sendFile(path.join(clientBuild, 'index.html'))
   });
}

module.exports = app;
