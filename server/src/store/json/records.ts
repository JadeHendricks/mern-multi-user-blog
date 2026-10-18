import type { CommentRecord, PostRecord, UserRecord } from '../records.js';

// What db.json holds: ISO strings for every date.
export type StoredUser = UserRecord<string>;
export type StoredComment = CommentRecord<string>;
export type StoredPost = PostRecord<string>;

/** The whole file, which is also the export format. */
export interface JsonState {
  schemaVersion: number;
  users: StoredUser[];
  posts: StoredPost[];
}
