import type { OwnUserDto, SocialsDto } from '@mern-blog/shared';

// The stored-record shape both adapters hand to the shared views and the export format uses: hex
// string ids, the repo's own names for the secrets, no empty socials. The date type says where the
// record comes from: ISO strings in the JSON file and in exports, Date objects out of Mongo.

export type DateValue = Date | string;

export interface LikeRecord {
  _id: string;
  user: string;
}

export interface CommentRecord<D extends DateValue = DateValue> {
  _id: string;
  user: string;
  comment: string;
  date: D;
}

export interface PostRecord<D extends DateValue = DateValue> {
  _id: string;
  /** Absent for a post imported without an author. */
  user?: string | undefined;
  image: string;
  title: string;
  tag: string;
  description: string;
  likes: LikeRecord[];
  comments: CommentRecord<D>[];
  date: D;
}

export interface UserRecord<D extends DateValue = DateValue> {
  _id: string;
  avatar: string;
  name: string;
  email: string;
  /** Always set in the JSON file; the Mongo adapter only reads it when secrets are selected. */
  passwordHash?: string | undefined;
  role: OwnUserDto['role'];
  status: OwnUserDto['status'];
  /** Absent until one is set. */
  socials?: SocialsDto | undefined;
  createdAt: D;
  updatedAt: D;
  passwordChangedAt?: D | undefined;
  activationHash?: string | undefined;
  activationExpires?: D | undefined;
  resetHash?: string | undefined;
  resetExpires?: D | undefined;
}
