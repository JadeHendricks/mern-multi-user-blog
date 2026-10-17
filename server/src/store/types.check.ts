import type { CommentDto, OwnUserDto, PostDto, PublicUserDto } from '@mern-blog/shared';
import type { CommentView, Jsonify, PostView, PublicUser, User } from './types.js';

// Compile-time proof that the store views stay the wire format: after JSON.stringify (Dates become
// ISO strings) every view is assignable to the DTO the API documents in @mern-blog/shared. If a view
// gains or changes a field that the DTO does not describe, this file stops compiling. No runtime code.
type Assert<T extends true> = T;

export type ViewsMatchTheWireFormat = [
  Assert<Jsonify<PostView> extends PostDto ? true : false>,
  Assert<Jsonify<CommentView> extends CommentDto ? true : false>,
  Assert<Jsonify<User> extends OwnUserDto ? true : false>,
  Assert<Jsonify<PublicUser> extends PublicUserDto ? true : false>,
];
