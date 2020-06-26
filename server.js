const express = require('express');
const app = express();
const port = 5000;
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const xss = require('xss-clean');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
dotenv.config();
const connectDB = require('./db');
const authRouter = require('./routes/authRoute');
const userRouter = require('./routes/userRoute');

//Connection to the database
connectDB();
app.listen(port, () => console.log(`Server running on port:${port}`))

//Middleware
app.use(helmet());
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);
app.use(express.json({ limit: '10kb' }));

//Data sanitization against noSQL query injection
app.use(mongoSanitize());
//Data sanitization against XSS - HTML Code
app.use(xss());
//Prevent parameter pollution - query string
app.use(hpp());

//Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/user', userRouter);