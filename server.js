const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
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

const connectDB = require('./db');

connectDB();

if (process.env.PORT) {
   app.listen(port, () => console.log(`Server running on port:${process.env.PORT}`))
}

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

if (process.env.NODE_ENV === 'production') {
   app.use(express.static('client/build'));
   app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'))
   });
}

module.exports = app;
