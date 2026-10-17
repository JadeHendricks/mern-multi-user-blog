import { User } from '../models/UserModel.js';
import jwt from 'jsonwebtoken';
import sendGridMail from '@sendgrid/mail';
import config from 'config';
import { newToken, hashToken } from '../lib/tokens.js';
import fs from 'fs';
import path from 'path';

sendGridMail.setApiKey(config.get('SG_API_KEY'));

// MAIL_TRANSPORT=file writes mail to disk instead of calling SendGrid (local and test runs)
const sendMail = (emailData) => {
    if (process.env.MAIL_TRANSPORT === 'file') {
        const dir = process.env.MAIL_OUTBOX_DIR || 'tmp/outbox';
        fs.mkdirSync(dir, { recursive: true });
        const name = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.json`;
        const { from, to, subject, html } = emailData;
        fs.writeFileSync(
            path.join(dir, name),
            JSON.stringify({ from, to, subject, html, createdAt: new Date().toISOString() }, null, 2)
        );
        return Promise.resolve();
    }
    return sendGridMail.send(emailData);
};

//Signup - email work flow
const ACTIVATION_TTL_MS = 24 * 60 * 60 * 1000;
const registerMessage = (email) =>
    `Email has been sent to ${email}. Follow the instructions to activate your account`;

export const register = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        // The same 200 is returned for new, pending and active emails so the endpoint
        // cannot be used to find out who has an account.
        const existing = await User.findOne({ email });
        let emailData;

        if (existing && existing.status === 'active') {
            emailData = {
                from: config.get('EMAIL_FROM'),
                to: email,
                subject: `You already have an account`,
                html: `
                <h1>You already have an account</h1>
                <p>Someone tried to sign up with this email address. If it was you, log in or reset your password.</p>
                <p>${config.get('CLIENT_URL')}/auth/login</p>
                `
            }
        } else {
            const { raw, hash } = newToken();
            const user = existing || new User({ email });
            user.name = name;
            user.password = password;
            user.status = 'pending';
            user.activationToken = hash;
            user.activationExpires = new Date(Date.now() + ACTIVATION_TTL_MS);
            await user.save();

            emailData = {
                from: config.get('EMAIL_FROM'),
                to: email,
                subject: `Account activation link`,
                html: `
                <h1>Please use the following link to activate your account</h1>
                <p>${config.get('CLIENT_URL')}/auth/activate/${raw}</p>
                <hr/>
                <p>This email may contain sensitive information</p>
                <p>${config.get('CLIENT_URL')}</p>
                `
            }
        }

        await sendMail(emailData);
        res.status(200).json({
            message: registerMessage(email)
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: err.message
        });
    }
}

export const accountActivation = async (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({
            message: 'No token associated to this account'
        });
    }

    try {
        const user = await User.findOne({ activationToken: hashToken(token) }).select('+activationExpires');
        if (!user || (user.status !== 'active' && !(user.activationExpires > new Date()))) {
            return res.status(401).json({
                message: 'Expired Link. Signup again'
            });
        }
        // The hash is kept after activation on purpose: a second use of the link is a 409, not "expired".
        if (user.status === 'active') {
            return res.status(409).json({
                message: 'Account is already activated'
            });
        }

        user.status = 'active';
        user.activationExpires = undefined;
        await user.save();

        res.status(201).json({
            message: 'Activation successful. Please login.'
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: err.message
        });
    }
}

// Lets the activation page greet the user by name without decoding anything client side.
export const activationPreview = async (req, res) => {
    const user = await User.findOne({
        activationToken: hashToken(req.params.token),
        status: 'pending',
        activationExpires: { $gt: new Date() }
    });
    if (!user) {
        return res.status(404).json({ message: 'Not found' });
    }
    res.status(200).json({ name: user.name });
}
// Session length comes from one setting so the JWT and the cookie always expire together.
const sessionDays = () => Number(config.get('COOKIE_EXPIRES_IN'));

// Same flags for setting and clearing: browsers only clear a cookie when the attributes match.
const baseCookieOptions = () => {
    const options = { httpOnly: true, sameSite: 'lax', path: '/' };
    if (process.env.NODE_ENV === 'production') options.secure = true;
    return options;
}

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email }).select('+password');

        if (!user || user.status !== 'active' || !(await user.correctPassword(password, user.password))) {
            return res.status(401).json({
                message: 'Incorrect email or password'
            });
        }

        const token = jwt.sign({ _id: user._id }, config.get('JWT_SECRET'), {
            expiresIn: sessionDays() * 24 * 60 * 60
        });

        res.cookie('authtoken', token, {
            ...baseCookieOptions(),
            expires: new Date(Date.now() + sessionDays() * 24 * 60 * 60 * 1000)
        });

        user.password = undefined;

        // The token only travels in the httpOnly cookie, never in the body.
        res.status(200).json({
            user
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: err.message
        });
    }
}

// Shared by protect and isLoggedIn: returns the user for a valid token, or null for a bad/expired
// token, a user that no longer exists, an inactive user, or a token issued before the last
// password change. Never throws on a bad token.
const verifySession = async (token) => {
    try {
        const decoded = jwt.verify(token, config.get('JWT_SECRET'));
        const user = await User.findById(decoded._id).select('+passwordChangedAt');
        if (!user || user.status !== 'active') return null;
        // iat is in whole seconds, so compare against the change time truncated to seconds
        if (user.passwordChangedAt && Math.floor(user.passwordChangedAt.getTime() / 1000) > decoded.iat) {
            return null;
        }
        return user;
    } catch {
        return null;
    }
}

export const isLoggedIn = async (req, res) => {
    if (req.cookies.authtoken) {
        const currentUser = await verifySession(req.cookies.authtoken);
        if (!currentUser) {
            return res.status(401).json({
                message: 'Token is no longer valid, please log in again.'
            });
        }
        return res.status(200).json({
            message: 'success'
        });
    }

    return res.status(401).json({
        message: 'You are not logged in, please login to view this page.'
    });
}

export const logout = (req, res) => {
    res.clearCookie('authtoken', baseCookieOptions());

    res.status(200).json({
        message: 'success'
    });
}

// GET logout is kept for old clients only; a GET that changes state can be triggered cross-site.
export const logoutDeprecated = (req, res) => {
    res.set('Deprecation', 'true');
    return logout(req, res);
}
export const protect = async (req, res, next) => {
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

    // verify the token and check the user still exists
    const currentUser = await verifySession(token);
    if (!currentUser) {
        return res.status(401).json({
            message: 'The user belonging to this token no longer exists'
        });
    }
    
    req.user = currentUser;
    next();
}

export const restrictTo = (...roles) => {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
          return res.status(403).json({
              message: 'You do not have permission to perform this action'
          });
      }
  
      next();
    };
};

const forgotMessage = (email) =>
    `Email has been sent to ${email}. Follow the instructions to reset your password`;
const RESET_TTL_MS = 30 * 60 * 1000;

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        // Unknown and pending emails get the same 200 so the endpoint cannot be used to find accounts.
        if (user && user.status === 'active') {
            const { raw, hash } = newToken();

            const emailData = {
                from: config.get('EMAIL_FROM'),
                to: email,
                subject: `Password Reset link`,
                html: `
                <h1>Please user the following link to reset your password</h1>
                <p>${config.get('CLIENT_URL')}/auth/password/reset/${raw}</p>
                <hr/>
                <p>This email may contain sensitive information</p>
                <p>${config.get('CLIENT_URL')}</p>
                `
            }

            await user.updateOne({
                resetPasswordLink: hash,
                resetPasswordExpires: new Date(Date.now() + RESET_TTL_MS)
            });

            await sendMail(emailData);
        }

        res.status(200).json({
            message: forgotMessage(email)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: err.message
        });
    }
}

export const resetPassword = async (req, res) => {
    const { resetPasswordLink, newPassword } = req.body;

    try {
        const user = await User.findOne({
            resetPasswordLink: hashToken(resetPasswordLink),
            resetPasswordExpires: { $gt: new Date() }
        });
        if (!user) {
            return res.status(400).json({
                message: 'Invalid or expired reset link'
            });
        }

        // Clearing the hash makes the link single-use; the pre-save hook sets passwordChangedAt,
        // which invalidates sessions issued before the reset.
        user.password = newPassword;
        user.resetPasswordLink = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({
            message: 'Password has been updated, Login!'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: err.message
        });
    }
}