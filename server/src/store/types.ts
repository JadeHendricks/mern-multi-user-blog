// Contracts every storage adapter implements.
//
// Conventions
// - Every method is async. Ids are 24-character lowercase hex strings; an invalid or unknown id
//   gives `null` (or a "not-found" status), never a thrown driver error.
// - Dates in returned views are Date objects (they serialise to ISO strings in JSON responses).
// - Views are API-ready (author populated, comment names resolved) and never contain secrets
//   unless `{ secrets: true }` is passed.
//
// The view types are derived from the DTOs in @mern-blog/shared (the wire format), so there is no
// second copy of a response shape in the server. See types.check.ts for the compile-time proof.
import type { CommentDto, OwnUserDto, PostDto, PublicUserDto, SocialsDto } from '@mern-blog/shared';
import type { Page, PageOptions } from '../lib/pagination.js';
import type { PostRecord, UserRecord } from './records.js';

export type { Page, PageOptions };
export type { JsonStoreDeps } from './json/file-db.js';

/** `T` with the listed keys as Date objects instead of ISO strings. */
export type WithDates<T, K extends keyof T> = Omit<T, K> & Record<K, Date>;

/** What `T` looks like after `JSON.stringify` and `JSON.parse`: Dates become ISO strings. */
export type Jsonify<T> = T extends Date
  ? string
  : T extends readonly (infer Item)[]
    ? Jsonify<Item>[]
    : T extends object
      ? { [Key in keyof T]: Jsonify<T[Key]> }
      : T;

export type UserRole = OwnUserDto['role'];
export type UserStatus = OwnUserDto['status'];
export type Socials = SocialsDto;

/** Only with `{ secrets: true }`. */
export interface UserSecrets {
  passwordHash?: string;
  passwordChangedAt?: Date;
  activationHash?: string;
  activationExpires?: Date;
  resetHash?: string;
  resetExpires?: Date;
}

/** `socials` is absent until one is set. */
export type User = WithDates<OwnUserDto, 'createdAt' | 'updatedAt'> & UserSecrets;

export type PublicUser = WithDates<PublicUserDto, 'createdAt'>;

/** `name` is the current name of the author ("Deleted user" when the account is gone) and `avatar`
 * the current avatar ("default.jpg" when the account is gone). */
export type CommentView = WithDates<CommentDto, 'date'>;

export interface LikeView {
  _id: string;
  user: string;
}

/**
 * `user` is an id from create/update, a populated author from find/list (with `socials` on find
 * only), and null when the author is gone. `likes` and `comments` are newest first.
 */
export type PostView = Omit<WithDates<PostDto, 'date'>, 'comments'> & { comments: CommentView[] };

export interface SecretsOption {
  secrets?: boolean | undefined;
}

/** Input for `createPending`. */
export interface NewPendingUser {
  name: string;
  email: string;
  passwordHash: string;
  activationHash: string;
  activationExpires: Date;
}

/** Input for `refreshPending`. */
export type PendingRefresh = Omit<NewPendingUser, 'email'>;

/** Input for `create` (seed and import): may carry `_id`, `status`, `role` and dates. */
export interface UserInput {
  _id?: string | undefined;
  name: string;
  email: string;
  passwordHash: string;
  avatar?: string | undefined;
  role?: UserRole | undefined;
  status?: UserStatus | undefined;
  socials?: Socials | undefined;
  createdAt?: Date | string | undefined;
  updatedAt?: Date | string | undefined;
  // The secret fields: null means the same as absent (an export from another database has them).
  passwordChangedAt?: Date | string | null | undefined;
  activationHash?: string | null | undefined;
  activationExpires?: Date | string | null | undefined;
  resetHash?: string | null | undefined;
  resetExpires?: Date | string | null | undefined;
}

export interface ProfileFields {
  name?: string | undefined;
  avatar?: string | undefined;
}

export interface UserRepo {
  findById(id: string, opts?: SecretsOption): Promise<User | null>;
  /** Pending users give null. */
  findPublicById(id: string): Promise<PublicUser | null>;
  /** The email is trimmed and matched case-insensitively. */
  findByEmail(email: string, opts?: SecretsOption): Promise<User | null>;
  /** Includes activationExpires. */
  findByActivationHash(hash: string): Promise<User | null>;
  /** Only while resetExpires is in the future. */
  findByResetHash(hash: string): Promise<User | null>;
  /** Active users, oldest first. */
  listPublic(page?: PageOptions): Promise<Page<PublicUser>>;
  /** Throws DuplicateEmailError. */
  createPending(data: NewPendingUser): Promise<User>;
  refreshPending(id: string, data: PendingRefresh): Promise<User | null>;
  /** Seed/import; may carry _id, status, dates. Throws DuplicateEmailError. */
  create(data: UserInput): Promise<User>;
  /** Keeps the activation hash so a second use is a 409. */
  activate(id: string): Promise<User | null>;
  /** Never upserts. */
  updateProfile(id: string, fields?: ProfileFields): Promise<User | null>;
  /** Only keys present are set. */
  updateSocials(id: string, fields?: Socials): Promise<User | null>;
  setResetToken(id: string, hash: string, expires: Date): Promise<void>;
  /** Single use; sets passwordChangedAt. */
  consumeReset(id: string, passwordHash: string): Promise<User | null>;
  deleteById(id: string): Promise<boolean>;
}

/** Input for `create`. */
export interface NewPost {
  user: string;
  title: string;
  tag?: string | undefined;
  description: string;
  image?: string | undefined;
}

export interface PostFields {
  title?: string | undefined;
  tag?: string | undefined;
  description?: string | undefined;
  image?: string | undefined;
}

/** Input for `insertMany` (seed and import). A comment names its author in `user` (`userId` is
 * accepted by the JSON adapter for older files). */
export interface PostInput {
  _id?: string | undefined;
  user?: string | undefined;
  image?: string | undefined;
  title: string;
  tag?: string | undefined;
  description: string;
  likes?: { _id?: string | undefined; user: string }[] | undefined;
  comments?:
    | {
        _id?: string | undefined;
        user?: string | undefined;
        userId?: string | undefined;
        comment: string;
        date?: Date | string | undefined;
      }[]
    | undefined;
  date?: Date | string | undefined;
}

export type LikeResult =
  { status: 'liked'; likes: LikeView[] } | { status: 'already' | 'not-found' };

export type UnlikeResult =
  { status: 'unliked'; likes: LikeView[] } | { status: 'not-liked' | 'not-found' };

export interface PostRepo {
  /** The author is populated with socials. */
  findById(id: string): Promise<PostView | null>;
  /** Newest first. */
  list(page?: PageOptions): Promise<Page<PostView>>;
  /** Newest first, like the main list (this endpoint used to return oldest first). */
  listByUser(userId: string, page?: PageOptions): Promise<Page<PostView>>;
  create(data: NewPost): Promise<PostView>;
  update(id: string, fields?: PostFields): Promise<PostView | null>;
  getOwnerAndImage(id: string): Promise<{ user: string | undefined; image: string } | null>;
  delete(id: string): Promise<{ image: string } | null>;
  exists(id: string): Promise<boolean>;
  /** Atomic. */
  like(id: string, userId: string): Promise<LikeResult>;
  /** Atomic. */
  unlike(id: string, userId: string): Promise<UnlikeResult>;
  /** Null when the post or user is missing. */
  addComment(id: string, userId: string, text: string): Promise<CommentView[] | null>;
  removeComment(
    id: string,
    commentId: string,
  ): Promise<'removed' | 'post-not-found' | 'comment-not-found'>;
  getComment(id: string, commentId: string): Promise<{ userId: string } | null>;
  /** Seed/import. */
  insertMany(posts: readonly PostInput[]): Promise<number>;
}

/** The whole database in the export format: ISO dates, secrets included, the repo's own field names. */
export interface ExportData {
  schemaVersion: number;
  users: UserRecord<string>[];
  posts: PostRecord<string>[];
}

/** What `importAll` accepts: an export, possibly from an older schema version. */
export interface ImportData {
  schemaVersion?: number | undefined;
  users: readonly UserRecord<string>[];
  posts: readonly PostRecord<string>[];
}

export interface Counts {
  users: number;
  posts: number;
}

/** The stored user including secrets, with Date objects, under the repo's own field names. */
export type RawUser = UserRecord<Date>;

/** Fields `patchUser` may overwrite, as stored. A null or undefined value removes the field. */
export type UserPatch = Record<string, unknown>;

export interface IndexInfo {
  key: Record<string, number>;
  unique: boolean;
}

/** Maintenance surface for import/export/seed and for tests. */
export interface StoreAdmin {
  exportAll(): Promise<ExportData>;
  importAll(data: ImportData, opts?: { replace?: boolean }): Promise<Counts>;
  reset(): Promise<void>;
  counts(): Promise<Counts>;
  /** The stored user including secrets. */
  rawUserByEmail(email: string): Promise<RawUser | null>;
  /** Overwrites stored fields (tests move time with this). */
  patchUser(id: string, fields: UserPatch): Promise<boolean>;
  /** Mongo adapter only. */
  indexes?(): Promise<{ users: IndexInfo[]; posts: IndexInfo[] }>;
}

export interface Store {
  users: UserRepo;
  posts: PostRepo;
  admin: StoreAdmin;
  init(): Promise<void>;
  close(): Promise<void>;
}

/** Settings `createStore` reads from the app config. */
export interface StoreConfig {
  DB_DRIVER: 'json' | 'mongo';
  DATA_DIR: string;
  MONGO_URI?: string | undefined;
  BACKUP_KEEP?: number | undefined;
}
