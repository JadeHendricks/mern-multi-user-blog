import mongoose from 'mongoose';

// Column names are the ones this database has always used (`password`, `activationToken`,
// `resetPasswordLink`, ...), so an existing database keeps working. users.js maps them to the
// repo names (passwordHash, activationHash, resetHash).
export const userSchema = new mongoose.Schema(
  {
    avatar: {
      type: String,
      default: 'default.jpg',
    },
    name: {
      type: String,
      trim: true,
      required: true,
      maxlength: 32,
    },
    email: {
      type: String,
      trim: true,
      required: true,
      lowercase: true,
      unique: true,
    },
    // bcrypt hash, produced by lib/password.js before it gets here
    password: {
      type: String,
      required: true,
      select: false,
    },
    socials: {
      facebook: {
        type: String,
      },
      linkedin: {
        type: String,
      },
      twitter: {
        type: String,
      },
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    // Defaults to active so documents created before this field existed keep working
    status: {
      type: String,
      enum: ['pending', 'active'],
      default: 'active',
    },
    // Secrets and bookkeeping are select:false so no query can leak them by accident.
    resetPasswordLink: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
    activationToken: {
      type: String,
      select: false,
    },
    activationExpires: {
      type: Date,
      select: false,
    },
    passwordChangedAt: {
      type: Date,
      select: false,
    },
  },
  // No __v: the API never exposed it meaningfully and the JSON adapter has no version key.
  { timestamps: true, versionKey: false },
);

// Models are bound to one Mongoose instance, so every store owns its own connection and models.
export const createUserModel = (instance) => instance.model('user', userSchema);
