const User = require('../models/UserModel');
const jwt = require('jsonwebtoken');
const sendGridMail = require('@sendgrid/mail');
const dotenv = require('dotenv');
const _ = require('lodash');
const fetch = require('node-fetch');
const { OAuth2Client } = require('google-auth-library');

dotenv.config();
sendGridMail.setApiKey(process.env.SG_API_KEY);

//Signup - email work flow
exports.register = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({
                message: 'Email Address already exists'
            });
        }

        const token = jwt.sign({ name, email, password }, process.env.JWT_ACCOUNT_ACTIVATION, {
           expiresIn: 3600000
        });

        const emailData = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: `Account activation link`,
            html: `
            <h1>Please user the following link to activate your account</h1>
            <p>${process.env.CLIENT_URL}/auth/activate/${token}</p>
            <hr/>
            <p>This email may contain sensitive information</p>
            <p>${process.env.CLIENT_URL}</p>
            `
        }

        await sendGridMail.send(emailData);
        res.status(200).json({
            message: `Email has been sent to ${email}. Follow the instructions to activate your account`
        });

    } catch (err) {
        console.error(err);
        return res.status(404).json({
            message: err.message
        });
    }
}

exports.accountActivation = async (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({
            message: 'No token associated to this account'
        });
    }

    try {
        const decoded = await jwt.verify(token, process.env.JWT_ACCOUNT_ACTIVATION);

        const { name, email, password } = decoded;
        await User.create({ name, email, password });

        res.status(201).json({
            message: 'Activation successful. Please signin'
        });
        
    } catch (err) {
        console.error(err);
        res.status(401).json({
            message: 'Expired Link. Signup again'
        });
    }
}

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email }).select('+password');

        if (!user || !(await user.correctPassword(password, user.password))) {
            return res.status(401).json({
                message: 'Incorrect email or password'
            });
        }

        const token = jwt.sign({ _id: user._id}, process.env.JWT_SECRET, { expiresIn: 3600000 });

        const cookieOptions = {
            expires: new Date(Date.now() + process.env.COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
            httpOnly: true
        }
        if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
        res.cookie('authtoken', token, cookieOptions);

        user.password = undefined;

        res.status(200).json({
            token,
            user
        });

    } catch (err) {
        console.error(err);
        res.status(400).json({
            message: err
        });
    }
}

exports.isLoggedIn = async (req, res) => {
    if (req.cookies.authtoken) {
      try {
        // 1) verify token
        const decoded = await jwt.verify(req.cookies.authtoken, process.env.JWT_SECRET);
        // 2) Check if user still exists
        const currentUser = await User.findById(decoded._id);
        if (!currentUser) {
            return res.status(401).json({
                message: 'Token is no longer valid, please log in again.'
            });
        }
        return res.status(200).json({
            message: 'success'
        });
      } catch (err) {
        return res.status(401).json({
            message: 'Token is no longer valid, please log in again.'
        });
      }
    }

    return res.status(401).json({
        message: 'You are not logged in, please login to view this page.'
    });
}

exports.logout = (req, res) => {
    res.cookie('authtoken', 'loggedout', {
        expires: new Date(Date.now() + 5 * 1000),
        httpOnly: true
    });

    res.status(200).json({
        message: 'success'
    });
}

exports.protect = async (req, res, next) => {
    let token;
    //first part is for the API
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.authtoken) {
        token = req.cookies.authtoken;
    }

    if (!token) {
        return res.status(401).json({
            message: 'You are not logged in! Please log in to get access.'
        });
    }

    //verify the token
    const decoded = await jwt.verify(token, process.env.JWT_SECRET);
    // check if the user still exists
    const currentUser = await User.findById(decoded._id);
    if (!currentUser) {
        return res.status(401).json({
            message: 'The user belonging to this token no longer exists'
        });
    }

    req.user = currentUser;
    next();
}

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
          return res.status(403).json({
              message: 'You do not have permission to perform this action'
          });
      }
  
      next();
    };
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                message: 'User does not exist'
            });
        }
    
        const token = jwt.sign({ _id: user._id, name: user.name }, process.env.JWT_RESET_PASSWORD, {
            expiresIn: 3600000
         });
    
         const emailData = {
             from: process.env.EMAIL_FROM,
             to: email,
             subject: `Password Reset link`,
             html: `
             <h1>Please user the following link to reset your password</h1>
             <p>${process.env.CLIENT_URL}/auth/password/reset/${token}</p>
             <hr/>
             <p>This email may contain sensitive information</p>
             <p>${process.env.CLIENT_URL}</p>
             `
         }
    
         await user.updateOne({ resetPasswordLink: token });
    
         await sendGridMail.send(emailData);
         res.status(200).json({
             message: `Email has been sent to ${email}. Follow the instructions to reset your password`
         });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            message: 'Server Error'
        })
    }
}

exports.resetPassword = async (req, res) => {
    const { resetPasswordLink, newPassword } = req.body;

    try {
        if (resetPasswordLink && await jwt.verify(resetPasswordLink, process.env.JWT_RESET_PASSWORD)) {
            let user = await User.findOne({ resetPasswordLink });
            if (!user) {
                return res.status(400).json({
                    message: 'User not found'
                });
            }
    
            const updatedFields = {
                password: newPassword,
                resetPasswordLink: ''
            }
    
            user = _.extend(user, updatedFields);
            await user.save();
    
            res.status(200).json({
                message: 'Password has been updated, Login!'
            })
        }   
    } catch (err) {
        console.error(err.message);
        res.status(401).json({
            message: err.message
        });
    }
}

const client = new OAuth2Client(process.env.REACT_APP_GOOGLE_CLIENT_ID);
exports.googleLogin = async (req, res) => {
    const { idToken } = req.body;

    try {
        const response = await client.verifyIdToken({ idToken, audience: process.env.REACT_APP_GOOGLE_CLIENT_ID });   

        if (response.payload.email_verified) {
            let user = await User.findOne({ email: response.payload.email });

            if (user) {
                const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
                    expiresIn: 3600000
                });

                const cookieOptions = {
                    expires: new Date(Date.now() + process.env.COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
                    httpOnly: true
                }
                if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
                res.cookie('authtoken', token, cookieOptions);

                const { _id, email, name, role } = user;
    
                res.status(200).json({
                    token,
                    user: { _id, email, name, role }
                });
            } 

            if (!user) {
                const password = response.payload.email + process.env.JWT_SECRET;
    
                user = new User({ name: response.payload.name, email: response.payload.email, password });
                user.save();
    
                const { _id, email, name, role } = user;
    
                const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
                    expiresIn: 3600000
                });

                const cookieOptions = {
                    expires: new Date(Date.now() + process.env.COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
                    httpOnly: true
                }
                if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
                res.cookie('authtoken', token, cookieOptions);
    
    
                res.status(200).json({
                    token,
                    user: { _id, email, name, role }
                });
            }
        }
        } catch (err) {
            console.error(err.message);
            res.status(400).json({
                error: err.message,
                message: 'Google Login Failed. Try Again!'
            });  
    }
}

exports.facebookLogin = async (req, res) => {
    const { accessToken, userID } = req.body;

    //this will give us the user profile
    const url = `https://graph.facebook.com/v2.11/${userID}/?fields=id,name,email&access_token=${accessToken}`;

    try {
        const response = await fetch(url, { method: 'GET'})
        const data = await response.json();

        let user = await User.findOne({ email: data.email });

        if (user) {
            const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
                expiresIn: 3600000
            });
            const { _id, email, name, role } = user;

            const cookieOptions = {
                expires: new Date(Date.now() + process.env.COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
                httpOnly: true
            }
            if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
            res.cookie('authtoken', token, cookieOptions);

            res.status(200).json({
                token,
                user: { _id, email, name, role }
            }); 
        }

        if (!user) {
            const password = data.email + process.env.JWT_SECRET;
    
            user = new User({ name: data.name, email: data.email, password });
            user.save();

            const { _id, email, name, role } = user;

            const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
                expiresIn: 3600000
            });

            const cookieOptions = {
                expires: new Date(Date.now() + process.env.COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
                httpOnly: true
            }
            if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
            res.cookie('authtoken', token, cookieOptions);


            res.status(200).json({
                token,
                user: { _id, email, name, role }
            });
        }

    } catch (err) {
        console.error(err.message);
        res.status(400).json({
            error: err.message,
            message: 'Facebook Login Failed. Try Again!'
        });  
    }
}