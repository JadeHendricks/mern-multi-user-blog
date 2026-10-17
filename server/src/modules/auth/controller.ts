import type {
  ActivationPreviewResponse,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  MessageResponse,
  RegisterRequest,
  ResetPasswordRequest,
} from '@mern-blog/shared';
import type { CookieOptions, NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../../config.js';
import type { Mailer } from '../../lib/mailer.js';
import { hashPassword, verifyPassword } from '../../lib/password.js';
import { requireUser } from '../../lib/require-user.js';
import { sendJson } from '../../lib/respond.js';
import { hashToken, newToken } from '../../lib/tokens.js';
import type { Store, UserRole } from '../../store/types.js';

const ACTIVATION_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 30 * 60 * 1000;

const registerMessage = (email: string): string =>
  `Email has been sent to ${email}. Follow the instructions to activate your account`;
const forgotMessage = (email: string): string =>
  `Email has been sent to ${email}. Follow the instructions to reset your password`;

// Session length comes from one setting so the JWT and the cookie always expire together.
const sessionDays = (): number => config.COOKIE_EXPIRES_IN;

// Same flags for setting and clearing: browsers only clear a cookie when the attributes match.
const baseCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  ...(config.NODE_ENV === 'production' ? { secure: true } : {}),
});

// What `login` signs into the token. `iat` is added by jsonwebtoken. Both are checked rather than
// trusted: a token that verifies but has another shape is treated like a bad token.
const sessionPayload = z.object({ _id: z.string(), iat: z.number().optional() });

const isFuture = (date: Date | undefined): boolean => date !== undefined && date > new Date();

// Express 5 leaves a missing body undefined and app.ts replaces it with {}. The route-specific
// body types below describe what a client is expected to send; the request schemas decide what
// is accepted (they are deliberately as loose as the validators this API shipped with).
type Body<T> = Request<Record<string, string>, MessageResponse, T>;
type Reply<T = MessageResponse> = Response<T>;

export const logout = (_req: Request, res: Reply): void => {
  res.clearCookie('authtoken', baseCookieOptions());
  res.status(200).json({
    message: 'success',
  });
};

// GET logout is kept for old clients only; a GET that changes state can be triggered cross-site.
export const logoutDeprecated = (req: Request, res: Reply): void => {
  res.set('Deprecation', 'true');
  logout(req, res);
};

export const restrictTo = (...roles: UserRole[]) => {
  return (req: Request, res: Reply, next: NextFunction): void => {
    if (!roles.includes(requireUser(req).role)) {
      res.status(403).json({
        message: 'You do not have permission to perform this action',
      });
      return;
    }
    next();
  };
};

// `store` is read at call time (store.users.x), never copied, so the app works with whichever
// store is plugged in and tests can swap it between files.
export const createAuthController = ({ store, mailer }: { store: Store; mailer: Mailer }) => {
  // Shared by protect and isLoggedIn: returns the user for a valid token, or null for a bad/expired
  // token, a user that no longer exists, an inactive user, or a token issued before the last
  // password change. Never throws on a bad token.
  const verifySession = async (token: unknown) => {
    // A cookie can parse to something other than text (cookie-parser reads `j:` JSON cookies); that
    // is a bad token, not a crash.
    if (typeof token !== 'string') return null;
    try {
      const decoded = sessionPayload.safeParse(
        jwt.verify(token, config.JWT_SECRET, { algorithms: ['HS256'] }),
      );
      if (!decoded.success) return null;
      const { _id, iat } = decoded.data;
      const withSecrets = await store.users.findById(_id, { secrets: true });
      if (withSecrets?.status !== 'active') return null;
      // iat is in whole seconds, so compare against the change time truncated to seconds
      if (
        withSecrets.passwordChangedAt &&
        iat !== undefined &&
        Math.floor(withSecrets.passwordChangedAt.getTime() / 1000) > iat
      ) {
        return null;
      }
      return await store.users.findById(_id);
    } catch {
      return null;
    }
  };

  //Signup - email work flow
  const register = async (req: Body<RegisterRequest>, res: Reply): Promise<void> => {
    const { name, email, password } = req.body;
    // The same 200 is returned for new, pending and active emails so the endpoint
    // cannot be used to find out who has an account.
    const existing = await store.users.findByEmail(email);
    let emailData;
    if (existing?.status === 'active') {
      emailData = {
        to: email,
        subject: `You already have an account`,
        html: `
                <h1>You already have an account</h1>
                <p>Someone tried to sign up with this email address. If it was you, log in or reset your password.</p>
                <p>${config.CLIENT_URL}/auth/login</p>
                `,
      };
    } else {
      const { raw, hash } = newToken();
      const signup = {
        name,
        passwordHash: await hashPassword(password),
        activationHash: hash,
        activationExpires: new Date(Date.now() + ACTIVATION_TTL_MS),
      };
      if (existing) {
        await store.users.refreshPending(existing._id, signup);
      } else {
        await store.users.createPending({ ...signup, email });
      }
      emailData = {
        to: email,
        subject: `Account activation link`,
        html: `
                <h1>Please use the following link to activate your account</h1>
                <p>${config.CLIENT_URL}/auth/activate/${raw}</p>
                <hr/>
                <p>This email may contain sensitive information</p>
                <p>${config.CLIENT_URL}</p>
                `,
      };
    }
    await mailer.send(emailData);
    res.status(200).json({
      message: registerMessage(email),
    });
  };

  const accountActivation = async (req: Body<{ token?: unknown }>, res: Reply): Promise<void> => {
    const { token } = req.body;
    if (!token) {
      res.status(400).json({
        message: 'No token associated to this account',
      });
      return;
    }
    const user = await store.users.findByActivationHash(hashToken(token));
    if (!user || (user.status !== 'active' && !isFuture(user.activationExpires))) {
      res.status(401).json({
        message: 'Expired Link. Signup again',
      });
      return;
    }
    // The hash is kept after activation on purpose: a second use of the link is a 409, not "expired".
    if (user.status === 'active') {
      res.status(409).json({
        message: 'Account is already activated',
      });
      return;
    }
    await store.users.activate(user._id);
    res.status(201).json({
      message: 'Activation successful. Please login.',
    });
  };

  // Lets the activation page greet the user by name without decoding anything client side.
  const activationPreview = async (
    req: Request<{ token: string }, ActivationPreviewResponse | MessageResponse>,
    res: Reply<ActivationPreviewResponse | MessageResponse>,
  ): Promise<void> => {
    const user = await store.users.findByActivationHash(hashToken(req.params.token));
    if (user?.status !== 'pending' || !isFuture(user.activationExpires)) {
      res.status(404).json({ message: 'Not found' });
      return;
    }
    res.status(200).json({ name: user.name });
  };

  const login = async (
    req: Body<LoginRequest>,
    res: Reply<LoginResponse | MessageResponse>,
  ): Promise<void> => {
    const { email, password } = req.body;
    const user = await store.users.findByEmail(email, { secrets: true });
    if (
      user?.status !== 'active' ||
      user.passwordHash === undefined ||
      !(await verifyPassword(password, user.passwordHash))
    ) {
      res.status(401).json({
        message: 'Incorrect email or password',
      });
      return;
    }
    // The account can be deleted between the credential check and this read; answer it like any
    // other failed login instead of setting a cookie and returning { user: null }.
    const profile = await store.users.findById(user._id);
    if (!profile) {
      res.status(401).json({
        message: 'Incorrect email or password',
      });
      return;
    }
    const token = jwt.sign({ _id: user._id }, config.JWT_SECRET, {
      algorithm: 'HS256',
      expiresIn: sessionDays() * 24 * 60 * 60,
    });
    res.cookie('authtoken', token, {
      ...baseCookieOptions(),
      expires: new Date(Date.now() + sessionDays() * 24 * 60 * 60 * 1000),
    });
    // The token only travels in the httpOnly cookie, never in the body.
    sendJson(res, 200, { user: profile });
  };

  const isLoggedIn = async (req: Request, res: Reply): Promise<void> => {
    const authtoken = cookieToken(req);
    if (authtoken) {
      const currentUser = await verifySession(authtoken);
      if (!currentUser) {
        res.status(401).json({
          message: 'Token is no longer valid, please log in again.',
        });
        return;
      }
      res.status(200).json({
        message: 'success',
      });
      return;
    }
    res.status(401).json({
      message: 'You are not logged in, please login to view this page.',
    });
  };

  const protect = async (req: Request, res: Reply, next: NextFunction): Promise<void> => {
    let token: unknown;
    const authorization = req.headers.authorization;
    //first part is for the API
    if (authorization?.startsWith('Bearer')) {
      token = authorization.split(' ')[1];
    } else {
      token = cookieToken(req);
    }
    if (!token) {
      res.status(401).json({
        message: 'You are not logged in! Please log in to get access.',
      });
      return;
    }
    // verify the token and check the user still exists
    const currentUser = await verifySession(token);
    if (!currentUser) {
      res.status(401).json({
        message: 'The user belonging to this token no longer exists',
      });
      return;
    }
    req.user = currentUser;
    next();
  };

  const forgotPassword = async (req: Body<ForgotPasswordRequest>, res: Reply): Promise<void> => {
    const { email } = req.body;
    const user = await store.users.findByEmail(email);
    // Unknown and pending emails get the same 200 so the endpoint cannot be used to find accounts.
    if (user?.status === 'active') {
      const { raw, hash } = newToken();
      const emailData = {
        to: email,
        subject: `Password Reset link`,
        html: `
                <h1>Please user the following link to reset your password</h1>
                <p>${config.CLIENT_URL}/auth/password/reset/${raw}</p>
                <hr/>
                <p>This email may contain sensitive information</p>
                <p>${config.CLIENT_URL}</p>
                `,
      };
      await store.users.setResetToken(user._id, hash, new Date(Date.now() + RESET_TTL_MS));
      await mailer.send(emailData);
    }
    res.status(200).json({
      message: forgotMessage(email),
    });
  };

  const resetPassword = async (req: Body<ResetPasswordRequest>, res: Reply): Promise<void> => {
    const { resetPasswordLink, newPassword } = req.body;
    const user = await store.users.findByResetHash(hashToken(resetPasswordLink));
    if (!user) {
      res.status(400).json({
        message: 'Invalid or expired reset link',
      });
      return;
    }
    // consumeReset clears the hash (single-use link) and sets passwordChangedAt,
    // which invalidates sessions issued before the reset.
    await store.users.consumeReset(user._id, await hashPassword(newPassword));
    res.status(200).json({
      message: 'Password has been updated, Login!',
    });
  };

  return {
    register,
    accountActivation,
    activationPreview,
    login,
    isLoggedIn,
    logout,
    logoutDeprecated,
    protect,
    restrictTo,
    forgotPassword,
    resetPassword,
  };
};

export type AuthController = ReturnType<typeof createAuthController>;

// The authtoken cookie as cookie-parser left it. Typed unknown on purpose: it is whatever the
// client sent (or a parsed `j:` JSON cookie), and verifySession decides whether it is usable.
function cookieToken(req: Request): unknown {
  const cookies = req.cookies as Record<string, unknown> | undefined;
  return cookies?.authtoken;
}
