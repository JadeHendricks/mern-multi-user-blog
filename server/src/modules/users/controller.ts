import type {
  MeResponse,
  MessageResponse,
  PublicUserResponse,
  UpdateMeRequest,
  UserListResponse,
} from '@mern-blog/shared';
import type { Request, Response } from 'express';
import { parsePageQuery } from '../../lib/pagination.js';
import { requireUser } from '../../lib/require-user.js';
import { sendJson } from '../../lib/respond.js';
import { makeUpload, removeStoredFile } from '../../lib/upload.js';
import type { ProfileFields, Store } from '../../store/types.js';

export const uploadUserAvatar = makeUpload({ subdir: 'users', prefix: 'user', field: 'avatar' });

type Params = Record<string, string>;

// The request schema lets a falsy non-text value through (it means "left out"), so the socials
// body is read as unknown values even though a well-behaved client sends text.
type SocialsBody = Partial<Record<'facebook' | 'linkedin' | 'twitter', unknown>>;

const text = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;

export const createUserController = ({ store }: { store: Store }) => {
  const getMe = async (
    req: Request<Params, MeResponse | MessageResponse>,
    res: Response<MeResponse | MessageResponse>,
  ): Promise<void> => {
    const user = await store.users.findById(requireUser(req)._id);
    if (!user) {
      res.status(400).json({
        message: 'User not found!',
      });
      return;
    }
    sendJson(res, 200, {
      message: 'success',
      user,
    });
  };

  const getUser = async (
    req: Request<{ id: string }, PublicUserResponse | MessageResponse>,
    res: Response<PublicUserResponse | MessageResponse>,
  ): Promise<void> => {
    // Public view: no email, role or timestamps beyond createdAt
    const user = await store.users.findPublicById(req.params.id);
    if (!user) {
      res.status(400).json({
        message: 'User not found!',
      });
      return;
    }
    sendJson(res, 200, {
      message: 'success',
      user,
    });
  };

  const getAllUsers = async (
    req: Request<Params, UserListResponse>,
    res: Response<UserListResponse>,
  ): Promise<void> => {
    // Pending (not yet activated) accounts are never listed by the repo
    const { items: users, nextCursor } = await store.users.listPublic(parsePageQuery(req.query));
    sendJson(res, 200, {
      message: 'success',
      users,
      nextCursor,
    });
  };

  const updateMe = async (
    req: Request<Params, MeResponse | MessageResponse, UpdateMeRequest>,
    res: Response<MeResponse | MessageResponse>,
  ): Promise<void> => {
    const { name } = req.body;
    const current = requireUser(req);
    const userFields: ProfileFields = {};
    if (name) userFields.name = name;
    if (req.file) userFields.avatar = req.file.filename;
    const user = await store.users.updateProfile(current._id, userFields);
    if (!user) {
      res.status(404).json({ message: 'User not found!' });
      return;
    }
    // req.user still holds the pre-update avatar; the replaced file is no longer referenced
    if (req.file) await removeStoredFile('users', current.avatar);
    sendJson(res, 200, {
      message: 'User details has been updated',
      user,
    });
  };

  const updateUserSocials = async (
    req: Request<{ id: string }, MeResponse | MessageResponse, SocialsBody>,
    res: Response<MeResponse | MessageResponse>,
  ): Promise<void> => {
    const { facebook, linkedin, twitter } = req.body;
    // Only the networks that were sent change; an empty string clears that one field.
    // A value that is not text (null, 0, false pass the validator as "left out") is not a link and
    // must not be stored; only text counts as sent.
    const user = await store.users.updateSocials(requireUser(req)._id, {
      facebook: text(facebook),
      linkedin: text(linkedin),
      twitter: text(twitter),
    });
    if (!user) {
      res.status(404).json({ message: 'User not found!' });
      return;
    }
    sendJson(res, 200, {
      message: 'Your socials have been updated',
      user,
    });
  };

  return { getMe, getUser, getAllUsers, updateMe, updateUserSocials };
};

export type UserController = ReturnType<typeof createUserController>;
