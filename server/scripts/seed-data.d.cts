// Types for seed-data.cjs. That file stays CommonJS on purpose (Playwright require()s it), so it is
// not type-checked itself; this declaration is the contract the seed script and its tests rely on.
// Keep the two in step: a key added to the data needs a line here.

type SeedUserKey = 'alice' | 'bob' | 'carol' | 'dan';

interface SeedSocials {
  facebook: string;
  linkedin: string;
  twitter: string;
}

interface SeedComment {
  by: string;
  text: string;
  date: string;
}

declare const data: {
  E2E_PASSWORD: string;
  SEED_ACTIVATION_TOKEN: string;
  PENDING_USER: { _id: string; name: string; email: string };
  SEED_IDS: {
    users: Record<SeedUserKey, string>;
    // A tuple, so SEED_IDS.posts[0] is a string and not string | undefined.
    posts: readonly [string, string, string, string, string, string];
  };
  SEED_USERS: readonly {
    key: SeedUserKey;
    name: string;
    email: string;
    socials?: SeedSocials;
  }[];
  SEED_POSTS: readonly {
    author: string;
    title: string;
    tag: string;
    date: string;
    description: string;
    likes: readonly string[];
    comments: readonly SeedComment[];
  }[];
};

export = data;
