// Contracts every storage adapter implements. JSDoc only: this file has no runtime code.
//
// Conventions
// - Every method is async. Ids are 24-character lowercase hex strings; an invalid or unknown id
//   gives `null` (or a "not-found" status), never a thrown driver error.
// - Dates in returned views are Date objects (they serialise to ISO strings in JSON responses).
// - Views are API-ready (author populated, comment names resolved) and never contain secrets
//   unless `{ secrets: true }` is passed.

/**
 * @typedef {object} User
 * @property {string} _id
 * @property {string} name
 * @property {string} email
 * @property {string} avatar
 * @property {{facebook?: string, linkedin?: string, twitter?: string}} [socials] absent until one is set
 * @property {'user'|'admin'} role
 * @property {'pending'|'active'} status
 * @property {Date} createdAt
 * @property {Date} updatedAt
 * Only with `{ secrets: true }`:
 * @property {string} [passwordHash]
 * @property {Date} [passwordChangedAt]
 * @property {string} [activationHash]
 * @property {Date} [activationExpires]
 * @property {string} [resetHash]
 * @property {Date} [resetExpires]
 */

/**
 * @typedef {object} PublicUser
 * @property {string} _id
 * @property {string} name
 * @property {string} avatar
 * @property {{facebook?: string, linkedin?: string, twitter?: string}} [socials]
 * @property {Date} createdAt
 */

/**
 * @typedef {object} CommentView
 * @property {string} _id
 * @property {string} comment
 * @property {Date} date
 * @property {string} userId
 * @property {string} name   current name of the author ("Deleted user" when the account is gone)
 * @property {string} avatar current avatar of the author ("default.jpg" when the account is gone)
 */

/**
 * @typedef {object} PostView
 * @property {string} _id
 * @property {string|{_id: string, name: string, avatar: string, socials?: object}|null} user
 *   an id from create/update, a populated author from find/list (null when the author is gone)
 * @property {string} image
 * @property {string} title
 * @property {string} tag
 * @property {string} description
 * @property {{_id: string, user: string}[]} likes newest first
 * @property {CommentView[]} comments newest first
 * @property {Date} date
 */

/**
 * @template T
 * @typedef {object} Page
 * @property {T[]} items
 * @property {string|null} nextCursor
 */

/**
 * @typedef {object} PageOptions
 * @property {string} [cursor]
 * @property {number} [limit] without a limit and a cursor everything is returned
 */

/**
 * @typedef {object} UserRepo
 * @property {(id: string, opts?: {secrets?: boolean}) => Promise<User|null>} findById
 * @property {(id: string) => Promise<PublicUser|null>} findPublicById pending users give null
 * @property {(email: string, opts?: {secrets?: boolean}) => Promise<User|null>} findByEmail trimmed, case-insensitive
 * @property {(hash: string) => Promise<User|null>} findByActivationHash includes activationExpires
 * @property {(hash: string) => Promise<User|null>} findByResetHash only while resetExpires is in the future
 * @property {(page?: PageOptions) => Promise<Page<PublicUser>>} listPublic active users, oldest first
 * @property {(data: {name: string, email: string, passwordHash: string, activationHash: string, activationExpires: Date}) => Promise<User>} createPending throws DuplicateEmailError
 * @property {(id: string, data: {name: string, passwordHash: string, activationHash: string, activationExpires: Date}) => Promise<User|null>} refreshPending
 * @property {(data: object) => Promise<User>} create seed/import; may carry _id, status, dates; throws DuplicateEmailError
 * @property {(id: string) => Promise<User|null>} activate keeps the activation hash so a second use is a 409
 * @property {(id: string, fields: {name?: string, avatar?: string}) => Promise<User|null>} updateProfile never upserts
 * @property {(id: string, fields: {facebook?: string, linkedin?: string, twitter?: string}) => Promise<User|null>} updateSocials only keys present are set
 * @property {(id: string, hash: string, expires: Date) => Promise<void>} setResetToken
 * @property {(id: string, passwordHash: string) => Promise<User|null>} consumeReset single use; sets passwordChangedAt
 * @property {(id: string) => Promise<boolean>} deleteById
 */

/**
 * @typedef {object} PostRepo
 * @property {(id: string) => Promise<PostView|null>} findById author populated with socials
 * @property {(page?: PageOptions) => Promise<Page<PostView>>} list newest first
 * @property {(userId: string, page?: PageOptions) => Promise<Page<PostView>>} listByUser oldest first (the order the API has always used)
 * @property {(data: {user: string, title: string, tag?: string, description: string, image?: string}) => Promise<PostView>} create
 * @property {(id: string, fields: {title?: string, tag?: string, description?: string, image?: string}) => Promise<PostView|null>} update
 * @property {(id: string) => Promise<{user: string, image: string}|null>} getOwnerAndImage
 * @property {(id: string) => Promise<{image: string}|null>} delete
 * @property {(id: string) => Promise<boolean>} exists
 * @property {(id: string, userId: string) => Promise<{status: 'liked'|'already'|'not-found', likes?: {_id: string, user: string}[]}>} like atomic
 * @property {(id: string, userId: string) => Promise<{status: 'unliked'|'not-liked'|'not-found', likes?: {_id: string, user: string}[]}>} unlike atomic
 * @property {(id: string, userId: string, text: string) => Promise<CommentView[]|null>} addComment null when the post or user is missing
 * @property {(id: string, commentId: string) => Promise<'removed'|'post-not-found'|'comment-not-found'>} removeComment
 * @property {(id: string, commentId: string) => Promise<{userId: string}|null>} getComment
 * @property {(posts: object[]) => Promise<number>} insertMany seed/import
 */

/**
 * @typedef {object} StoreAdmin maintenance surface for import/export/seed and for tests
 * @property {() => Promise<{schemaVersion: number, users: object[], posts: object[]}>} exportAll
 * @property {(data: object, opts?: {replace?: boolean}) => Promise<{users: number, posts: number}>} importAll
 * @property {() => Promise<void>} reset
 * @property {() => Promise<{users: number, posts: number}>} counts
 * @property {(email: string) => Promise<object|null>} rawUserByEmail the stored user including secrets
 * @property {(id: string, fields: object) => Promise<boolean>} patchUser overwrite stored fields (tests move time with this)
 * @property {() => Promise<{users: {key: object, unique: boolean}[], posts: {key: object, unique: boolean}[]}>} [indexes] Mongo adapter only
 */

/**
 * @typedef {object} Store
 * @property {UserRepo} users
 * @property {PostRepo} posts
 * @property {StoreAdmin} admin
 * @property {() => Promise<void>} init
 * @property {() => Promise<void>} close
 */

export {};
