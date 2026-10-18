// GENERATED once from the express-validator chains (server/src/modules/*/schema.js) at the commit
// before they were removed. Each row is [body, expected message or null when the body is valid].
// The expectations are recorded legacy behaviour: do not edit them to make a test pass.

export type Row = readonly [body: unknown, message: string | null];

export const register: readonly Row[] = [
  [{}, 'Name is required'],
  [{ name: 'Ann', email: 'a@b.co', password: '123456' }, null],
  [{ email: 'a@b.co', password: '123456' }, 'Name is required'],
  [{ name: null, email: 'a@b.co', password: '123456' }, 'Name is required'],
  [{ name: '', email: 'a@b.co', password: '123456' }, 'Name is required'],
  [{ name: ' ', email: 'a@b.co', password: '123456' }, null],
  [{ name: '   x   ', email: 'a@b.co', password: '123456' }, null],
  [{ name: 'x', email: 'a@b.co', password: '123456' }, null],
  [{ name: 5, email: 'a@b.co', password: '123456' }, null],
  [{ name: 0, email: 'a@b.co', password: '123456' }, null],
  [{ name: true, email: 'a@b.co', password: '123456' }, null],
  [{ name: false, email: 'a@b.co', password: '123456' }, null],
  [{ name: [], email: 'a@b.co', password: '123456' }, null],
  [{ name: [''], email: 'a@b.co', password: '123456' }, 'Name is required'],
  [{ name: ['x'], email: 'a@b.co', password: '123456' }, null],
  [{ name: ['x', ''], email: 'a@b.co', password: '123456' }, 'Name is required'],
  [{ name: [['x']], email: 'a@b.co', password: '123456' }, null],
  [{ name: {}, email: 'a@b.co', password: '123456' }, null],
  [{ name: { a: 1 }, email: 'a@b.co', password: '123456' }, null],
  [{ name: { toString: 'x' }, email: 'a@b.co', password: '123456' }, null],
  [
    {
      name: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      email: 'a@b.co',
      password: '123456',
    },
    null,
  ],
  [{ name: 'Ann', password: '123456' }, 'Must be a valid email address'],
  [{ name: 'Ann', email: null, password: '123456' }, 'Must be a valid email address'],
  [{ name: 'Ann', email: '', password: '123456' }, 'Must be a valid email address'],
  [{ name: 'Ann', email: ' ', password: '123456' }, 'Must be a valid email address'],
  [{ name: 'Ann', email: '   x   ', password: '123456' }, 'Must be a valid email address'],
  [{ name: 'Ann', email: 'x', password: '123456' }, 'Must be a valid email address'],
  [{ name: 'Ann', email: 5, password: '123456' }, 'Must be a valid email address'],
  [{ name: 'Ann', email: 0, password: '123456' }, 'Must be a valid email address'],
  [{ name: 'Ann', email: true, password: '123456' }, 'Must be a valid email address'],
  [{ name: 'Ann', email: false, password: '123456' }, 'Must be a valid email address'],
  [{ name: 'Ann', email: [], password: '123456' }, null],
  [{ name: 'Ann', email: [''], password: '123456' }, 'Must be a valid email address'],
  [{ name: 'Ann', email: ['x'], password: '123456' }, 'Must be a valid email address'],
  [{ name: 'Ann', email: ['x', ''], password: '123456' }, 'Must be a valid email address'],
  [{ name: 'Ann', email: [['x']], password: '123456' }, 'Must be a valid email address'],
  [{ name: 'Ann', email: {}, password: '123456' }, 'Must be a valid email address'],
  [{ name: 'Ann', email: { a: 1 }, password: '123456' }, 'Must be a valid email address'],
  [{ name: 'Ann', email: { toString: 'x' }, password: '123456' }, 'Must be a valid email address'],
  [
    {
      name: 'Ann',
      email:
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      password: '123456',
    },
    'Must be a valid email address',
  ],
  [{ name: 'Ann', email: 'a@b', password: '123456' }, 'Must be a valid email address'],
  [{ name: 'Ann', email: ' a@b.co ', password: '123456' }, 'Must be a valid email address'],
  [{ name: 'Ann', email: 'A@B.CO', password: '123456' }, null],
  [{ name: 'Ann', email: 'a b@c.co', password: '123456' }, 'Must be a valid email address'],
  [{ name: 'Ann', email: 'a@b.c', password: '123456' }, 'Must be a valid email address'],
  [{ name: 'Ann', email: '@b.co', password: '123456' }, 'Must be a valid email address'],
  [{ name: 'Ann', email: 'a@@b.co', password: '123456' }, 'Must be a valid email address'],
  [{ name: 'Ann', email: 'a@b.co\n', password: '123456' }, 'Must be a valid email address'],
  [{ name: 'Ann', email: '�n�@b�cher.de', password: '123456' }, 'Must be a valid email address'],
  [{ name: 'Ann', email: 'a+tag@b.co', password: '123456' }, null],
  [
    {
      name: 'Ann',
      email:
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa@b.co',
      password: '123456',
    },
    'Must be a valid email address',
  ],
  [{ name: 'Ann', email: ['a@b.co'], password: '123456' }, null],
  [{ name: 'Ann', email: ['a@b.co', 'nope'], password: '123456' }, 'Must be a valid email address'],
  [{ name: 'Ann', email: 'a@[127.0.0.1]', password: '123456' }, 'Must be a valid email address'],
  [{ name: 'Ann', email: 'a@b.co' }, 'Password must be atleast 6 characters long'],
  [{ name: 'Ann', email: 'a@b.co', password: null }, 'Password must be atleast 6 characters long'],
  [{ name: 'Ann', email: 'a@b.co', password: '' }, 'Password must be atleast 6 characters long'],
  [{ name: 'Ann', email: 'a@b.co', password: ' ' }, 'Password must be atleast 6 characters long'],
  [{ name: 'Ann', email: 'a@b.co', password: '   x   ' }, null],
  [{ name: 'Ann', email: 'a@b.co', password: 'x' }, 'Password must be atleast 6 characters long'],
  [{ name: 'Ann', email: 'a@b.co', password: 5 }, 'Password must be atleast 6 characters long'],
  [{ name: 'Ann', email: 'a@b.co', password: 0 }, 'Password must be atleast 6 characters long'],
  [{ name: 'Ann', email: 'a@b.co', password: true }, 'Password must be atleast 6 characters long'],
  [{ name: 'Ann', email: 'a@b.co', password: false }, 'Password must be atleast 6 characters long'],
  [{ name: 'Ann', email: 'a@b.co', password: [] }, null],
  [{ name: 'Ann', email: 'a@b.co', password: [''] }, 'Password must be atleast 6 characters long'],
  [{ name: 'Ann', email: 'a@b.co', password: ['x'] }, 'Password must be atleast 6 characters long'],
  [
    { name: 'Ann', email: 'a@b.co', password: ['x', ''] },
    'Password must be atleast 6 characters long',
  ],
  [
    { name: 'Ann', email: 'a@b.co', password: [['x']] },
    'Password must be atleast 6 characters long',
  ],
  [{ name: 'Ann', email: 'a@b.co', password: {} }, null],
  [{ name: 'Ann', email: 'a@b.co', password: { a: 1 } }, null],
  [{ name: 'Ann', email: 'a@b.co', password: { toString: 'x' } }, null],
  [
    {
      name: 'Ann',
      email: 'a@b.co',
      password:
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    },
    null,
  ],
  [
    { name: 'Ann', email: 'a@b.co', password: '12345' },
    'Password must be atleast 6 characters long',
  ],
  [{ name: 'Ann', email: 'a@b.co', password: '1234567' }, null],
  [{ name: 'Ann', email: 'a@b.co', password: '????????????' }, null],
  [{ name: 'Ann', email: 'a@b.co', password: '??????????' }, null],
  [
    {
      name: 'Ann',
      email: 'a@b.co',
      password:
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    },
    null,
  ],
  [{ name: 'Ann', email: 'a@b.co', password: ['123456'] }, null],
  [
    { name: 'Ann', email: 'a@b.co', password: ['123456', '1'] },
    'Password must be atleast 6 characters long',
  ],
  [{ name: null, email: null, password: null }, 'Name is required'],
  [{ name: '', email: '', password: '' }, 'Name is required'],
  [{ name: ' ', email: ' ', password: ' ' }, 'Must be a valid email address'],
  [{ name: '   x   ', email: '   x   ', password: '   x   ' }, 'Must be a valid email address'],
  [{ name: 'x', email: 'x', password: 'x' }, 'Must be a valid email address'],
  [{ name: 5, email: 5, password: 5 }, 'Must be a valid email address'],
  [{ name: 0, email: 0, password: 0 }, 'Must be a valid email address'],
  [{ name: true, email: true, password: true }, 'Must be a valid email address'],
  [{ name: false, email: false, password: false }, 'Must be a valid email address'],
  [{ name: [], email: [], password: [] }, null],
  [{ name: [''], email: [''], password: [''] }, 'Name is required'],
  [{ name: ['x'], email: ['x'], password: ['x'] }, 'Must be a valid email address'],
  [{ name: ['x', ''], email: ['x', ''], password: ['x', ''] }, 'Name is required'],
  [{ name: [['x']], email: [['x']], password: [['x']] }, 'Must be a valid email address'],
  [{ name: {}, email: {}, password: {} }, 'Must be a valid email address'],
  [{ name: { a: 1 }, email: { a: 1 }, password: { a: 1 } }, 'Must be a valid email address'],
  [
    { name: { toString: 'x' }, email: { toString: 'x' }, password: { toString: 'x' } },
    'Must be a valid email address',
  ],
  [
    {
      name: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      email:
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      password:
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    },
    'Must be a valid email address',
  ],
];

export const login: readonly Row[] = [
  [{}, 'Invalid Credentials'],
  [{ email: 'a@b.co', password: '123456' }, null],
  [{ password: '123456' }, 'Invalid Credentials'],
  [{ email: null, password: '123456' }, 'Invalid Credentials'],
  [{ email: '', password: '123456' }, 'Invalid Credentials'],
  [{ email: ' ', password: '123456' }, 'Invalid Credentials'],
  [{ email: '   x   ', password: '123456' }, 'Invalid Credentials'],
  [{ email: 'x', password: '123456' }, 'Invalid Credentials'],
  [{ email: 5, password: '123456' }, 'Invalid Credentials'],
  [{ email: 0, password: '123456' }, 'Invalid Credentials'],
  [{ email: true, password: '123456' }, 'Invalid Credentials'],
  [{ email: false, password: '123456' }, 'Invalid Credentials'],
  [{ email: [], password: '123456' }, null],
  [{ email: [''], password: '123456' }, 'Invalid Credentials'],
  [{ email: ['x'], password: '123456' }, 'Invalid Credentials'],
  [{ email: ['x', ''], password: '123456' }, 'Invalid Credentials'],
  [{ email: [['x']], password: '123456' }, 'Invalid Credentials'],
  [{ email: {}, password: '123456' }, 'Invalid Credentials'],
  [{ email: { a: 1 }, password: '123456' }, 'Invalid Credentials'],
  [{ email: { toString: 'x' }, password: '123456' }, 'Invalid Credentials'],
  [
    {
      email:
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      password: '123456',
    },
    'Invalid Credentials',
  ],
  [{ email: 'a@b', password: '123456' }, 'Invalid Credentials'],
  [{ email: ' a@b.co ', password: '123456' }, 'Invalid Credentials'],
  [{ email: 'A@B.CO', password: '123456' }, null],
  [{ email: 'a b@c.co', password: '123456' }, 'Invalid Credentials'],
  [{ email: 'a@b.c', password: '123456' }, 'Invalid Credentials'],
  [{ email: '@b.co', password: '123456' }, 'Invalid Credentials'],
  [{ email: 'a@@b.co', password: '123456' }, 'Invalid Credentials'],
  [{ email: 'a@b.co\n', password: '123456' }, 'Invalid Credentials'],
  [{ email: '�n�@b�cher.de', password: '123456' }, 'Invalid Credentials'],
  [{ email: 'a+tag@b.co', password: '123456' }, null],
  [
    {
      email:
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa@b.co',
      password: '123456',
    },
    'Invalid Credentials',
  ],
  [{ email: ['a@b.co'], password: '123456' }, null],
  [{ email: ['a@b.co', 'nope'], password: '123456' }, 'Invalid Credentials'],
  [{ email: 'a@[127.0.0.1]', password: '123456' }, 'Invalid Credentials'],
  [{ email: 'a@b.co' }, 'Invalid Credentials'],
  [{ email: 'a@b.co', password: null }, 'Invalid Credentials'],
  [{ email: 'a@b.co', password: '' }, 'Invalid Credentials'],
  [{ email: 'a@b.co', password: ' ' }, 'Invalid Credentials'],
  [{ email: 'a@b.co', password: '   x   ' }, null],
  [{ email: 'a@b.co', password: 'x' }, 'Invalid Credentials'],
  [{ email: 'a@b.co', password: 5 }, 'Invalid Credentials'],
  [{ email: 'a@b.co', password: 0 }, 'Invalid Credentials'],
  [{ email: 'a@b.co', password: true }, 'Invalid Credentials'],
  [{ email: 'a@b.co', password: false }, 'Invalid Credentials'],
  [{ email: 'a@b.co', password: [] }, null],
  [{ email: 'a@b.co', password: [''] }, 'Invalid Credentials'],
  [{ email: 'a@b.co', password: ['x'] }, 'Invalid Credentials'],
  [{ email: 'a@b.co', password: ['x', ''] }, 'Invalid Credentials'],
  [{ email: 'a@b.co', password: [['x']] }, 'Invalid Credentials'],
  [{ email: 'a@b.co', password: {} }, null],
  [{ email: 'a@b.co', password: { a: 1 } }, null],
  [{ email: 'a@b.co', password: { toString: 'x' } }, null],
  [
    {
      email: 'a@b.co',
      password:
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    },
    null,
  ],
  [{ email: 'a@b.co', password: '12345' }, 'Invalid Credentials'],
  [{ email: 'a@b.co', password: '1234567' }, null],
  [{ email: 'a@b.co', password: '????????????' }, null],
  [{ email: 'a@b.co', password: '??????????' }, null],
  [
    {
      email: 'a@b.co',
      password:
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    },
    null,
  ],
  [{ email: 'a@b.co', password: ['123456'] }, null],
  [{ email: 'a@b.co', password: ['123456', '1'] }, 'Invalid Credentials'],
  [{ email: null, password: null }, 'Invalid Credentials'],
  [{ email: '', password: '' }, 'Invalid Credentials'],
  [{ email: ' ', password: ' ' }, 'Invalid Credentials'],
  [{ email: '   x   ', password: '   x   ' }, 'Invalid Credentials'],
  [{ email: 'x', password: 'x' }, 'Invalid Credentials'],
  [{ email: 5, password: 5 }, 'Invalid Credentials'],
  [{ email: 0, password: 0 }, 'Invalid Credentials'],
  [{ email: true, password: true }, 'Invalid Credentials'],
  [{ email: false, password: false }, 'Invalid Credentials'],
  [{ email: [], password: [] }, null],
  [{ email: [''], password: [''] }, 'Invalid Credentials'],
  [{ email: ['x'], password: ['x'] }, 'Invalid Credentials'],
  [{ email: ['x', ''], password: ['x', ''] }, 'Invalid Credentials'],
  [{ email: [['x']], password: [['x']] }, 'Invalid Credentials'],
  [{ email: {}, password: {} }, 'Invalid Credentials'],
  [{ email: { a: 1 }, password: { a: 1 } }, 'Invalid Credentials'],
  [{ email: { toString: 'x' }, password: { toString: 'x' } }, 'Invalid Credentials'],
  [
    {
      email:
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      password:
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    },
    'Invalid Credentials',
  ],
];

export const forgotPassword: readonly Row[] = [
  [{}, 'Invalid value'],
  [{ email: 'a@b.co' }, null],
  [{ email: null }, 'Invalid value'],
  [{ email: '' }, 'Invalid value'],
  [{ email: ' ' }, 'Must be a valid email address'],
  [{ email: '   x   ' }, 'Must be a valid email address'],
  [{ email: 'x' }, 'Must be a valid email address'],
  [{ email: 5 }, 'Must be a valid email address'],
  [{ email: 0 }, 'Must be a valid email address'],
  [{ email: true }, 'Must be a valid email address'],
  [{ email: false }, 'Must be a valid email address'],
  [{ email: [] }, null],
  [{ email: [''] }, 'Invalid value'],
  [{ email: ['x'] }, 'Must be a valid email address'],
  [{ email: ['x', ''] }, 'Invalid value'],
  [{ email: [['x']] }, 'Must be a valid email address'],
  [{ email: {} }, 'Must be a valid email address'],
  [{ email: { a: 1 } }, 'Must be a valid email address'],
  [{ email: { toString: 'x' } }, 'Must be a valid email address'],
  [
    {
      email:
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    },
    'Must be a valid email address',
  ],
  [{ email: 'a@b' }, 'Must be a valid email address'],
  [{ email: ' a@b.co ' }, 'Must be a valid email address'],
  [{ email: 'A@B.CO' }, null],
  [{ email: 'a b@c.co' }, 'Must be a valid email address'],
  [{ email: 'a@b.c' }, 'Must be a valid email address'],
  [{ email: '@b.co' }, 'Must be a valid email address'],
  [{ email: 'a@@b.co' }, 'Must be a valid email address'],
  [{ email: 'a@b.co\n' }, 'Must be a valid email address'],
  [{ email: '�n�@b�cher.de' }, 'Must be a valid email address'],
  [{ email: 'a+tag@b.co' }, null],
  [
    {
      email:
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa@b.co',
    },
    'Must be a valid email address',
  ],
  [{ email: ['a@b.co'] }, null],
  [{ email: ['a@b.co', 'nope'] }, 'Must be a valid email address'],
  [{ email: 'a@[127.0.0.1]' }, 'Must be a valid email address'],
];

export const resetPassword: readonly Row[] = [
  [{}, 'Invalid value'],
  [{ newPassword: '123456', resetPasswordLink: 'tok' }, null],
  [{ resetPasswordLink: 'tok' }, 'Invalid value'],
  [{ newPassword: null, resetPasswordLink: 'tok' }, 'Invalid value'],
  [{ newPassword: '', resetPasswordLink: 'tok' }, 'Invalid value'],
  [{ newPassword: ' ', resetPasswordLink: 'tok' }, 'Password must be atleast 6 characters long'],
  [{ newPassword: '   x   ', resetPasswordLink: 'tok' }, null],
  [{ newPassword: 'x', resetPasswordLink: 'tok' }, 'Password must be atleast 6 characters long'],
  [{ newPassword: 5, resetPasswordLink: 'tok' }, 'Password must be atleast 6 characters long'],
  [{ newPassword: 0, resetPasswordLink: 'tok' }, 'Password must be atleast 6 characters long'],
  [{ newPassword: true, resetPasswordLink: 'tok' }, 'Password must be atleast 6 characters long'],
  [{ newPassword: false, resetPasswordLink: 'tok' }, 'Password must be atleast 6 characters long'],
  [{ newPassword: [], resetPasswordLink: 'tok' }, null],
  [{ newPassword: [''], resetPasswordLink: 'tok' }, 'Invalid value'],
  [{ newPassword: ['x'], resetPasswordLink: 'tok' }, 'Password must be atleast 6 characters long'],
  [{ newPassword: ['x', ''], resetPasswordLink: 'tok' }, 'Invalid value'],
  [
    { newPassword: [['x']], resetPasswordLink: 'tok' },
    'Password must be atleast 6 characters long',
  ],
  [{ newPassword: {}, resetPasswordLink: 'tok' }, null],
  [{ newPassword: { a: 1 }, resetPasswordLink: 'tok' }, null],
  [{ newPassword: { toString: 'x' }, resetPasswordLink: 'tok' }, null],
  [
    {
      newPassword:
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      resetPasswordLink: 'tok',
    },
    null,
  ],
  [
    { newPassword: '12345', resetPasswordLink: 'tok' },
    'Password must be atleast 6 characters long',
  ],
  [{ newPassword: '1234567', resetPasswordLink: 'tok' }, null],
  [{ newPassword: '????????????', resetPasswordLink: 'tok' }, null],
  [{ newPassword: '??????????', resetPasswordLink: 'tok' }, null],
  [
    {
      newPassword:
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      resetPasswordLink: 'tok',
    },
    null,
  ],
  [{ newPassword: ['123456'], resetPasswordLink: 'tok' }, null],
  [
    { newPassword: ['123456', '1'], resetPasswordLink: 'tok' },
    'Password must be atleast 6 characters long',
  ],
  [{ newPassword: '123456' }, 'Reset link is required'],
  [{ newPassword: '123456', resetPasswordLink: null }, 'Reset link is required'],
  [{ newPassword: '123456', resetPasswordLink: '' }, 'Reset link is required'],
  [{ newPassword: '123456', resetPasswordLink: ' ' }, null],
  [{ newPassword: '123456', resetPasswordLink: '   x   ' }, null],
  [{ newPassword: '123456', resetPasswordLink: 'x' }, null],
  [{ newPassword: '123456', resetPasswordLink: 5 }, null],
  [{ newPassword: '123456', resetPasswordLink: 0 }, null],
  [{ newPassword: '123456', resetPasswordLink: true }, null],
  [{ newPassword: '123456', resetPasswordLink: false }, null],
  [{ newPassword: '123456', resetPasswordLink: [] }, null],
  [{ newPassword: '123456', resetPasswordLink: [''] }, 'Reset link is required'],
  [{ newPassword: '123456', resetPasswordLink: ['x'] }, null],
  [{ newPassword: '123456', resetPasswordLink: ['x', ''] }, 'Reset link is required'],
  [{ newPassword: '123456', resetPasswordLink: [['x']] }, null],
  [{ newPassword: '123456', resetPasswordLink: {} }, null],
  [{ newPassword: '123456', resetPasswordLink: { a: 1 } }, null],
  [{ newPassword: '123456', resetPasswordLink: { toString: 'x' } }, null],
  [
    {
      newPassword: '123456',
      resetPasswordLink:
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    },
    null,
  ],
  [{ newPassword: null, resetPasswordLink: null }, 'Invalid value'],
  [{ newPassword: '', resetPasswordLink: '' }, 'Invalid value'],
  [{ newPassword: ' ', resetPasswordLink: ' ' }, 'Password must be atleast 6 characters long'],
  [{ newPassword: '   x   ', resetPasswordLink: '   x   ' }, null],
  [{ newPassword: 'x', resetPasswordLink: 'x' }, 'Password must be atleast 6 characters long'],
  [{ newPassword: 5, resetPasswordLink: 5 }, 'Password must be atleast 6 characters long'],
  [{ newPassword: 0, resetPasswordLink: 0 }, 'Password must be atleast 6 characters long'],
  [{ newPassword: true, resetPasswordLink: true }, 'Password must be atleast 6 characters long'],
  [{ newPassword: false, resetPasswordLink: false }, 'Password must be atleast 6 characters long'],
  [{ newPassword: [], resetPasswordLink: [] }, null],
  [{ newPassword: [''], resetPasswordLink: [''] }, 'Invalid value'],
  [{ newPassword: ['x'], resetPasswordLink: ['x'] }, 'Password must be atleast 6 characters long'],
  [{ newPassword: ['x', ''], resetPasswordLink: ['x', ''] }, 'Invalid value'],
  [
    { newPassword: [['x']], resetPasswordLink: [['x']] },
    'Password must be atleast 6 characters long',
  ],
  [{ newPassword: {}, resetPasswordLink: {} }, null],
  [{ newPassword: { a: 1 }, resetPasswordLink: { a: 1 } }, null],
  [{ newPassword: { toString: 'x' }, resetPasswordLink: { toString: 'x' } }, null],
  [
    {
      newPassword:
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      resetPasswordLink:
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    },
    null,
  ],
];

export const createPost: readonly Row[] = [
  [{}, 'Title is required.'],
  [{ title: 'T', description: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }, null],
  [{ description: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }, 'Title is required.'],
  [
    { title: null, description: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
    'Title is required.',
  ],
  [
    { title: '', description: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
    'Title is required.',
  ],
  [{ title: ' ', description: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }, null],
  [{ title: '   x   ', description: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }, null],
  [{ title: 'x', description: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }, null],
  [{ title: 5, description: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }, null],
  [{ title: 0, description: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }, null],
  [{ title: true, description: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }, null],
  [{ title: false, description: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }, null],
  [{ title: [], description: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }, null],
  [
    { title: [''], description: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
    'Title is required.',
  ],
  [{ title: ['x'], description: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }, null],
  [
    { title: ['x', ''], description: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
    'Title is required.',
  ],
  [{ title: [['x']], description: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }, null],
  [{ title: {}, description: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }, null],
  [{ title: { a: 1 }, description: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }, null],
  [
    { title: { toString: 'x' }, description: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
    null,
  ],
  [
    {
      title:
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      description: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    },
    null,
  ],
  [{ title: 'T' }, 'Description must be atleast 50 characters long.'],
  [{ title: 'T', description: null }, 'Description must be atleast 50 characters long.'],
  [{ title: 'T', description: '' }, 'Description must be atleast 50 characters long.'],
  [{ title: 'T', description: ' ' }, 'Description must be atleast 50 characters long.'],
  [{ title: 'T', description: '   x   ' }, 'Description must be atleast 50 characters long.'],
  [{ title: 'T', description: 'x' }, 'Description must be atleast 50 characters long.'],
  [{ title: 'T', description: 5 }, 'Description must be atleast 50 characters long.'],
  [{ title: 'T', description: 0 }, 'Description must be atleast 50 characters long.'],
  [{ title: 'T', description: true }, 'Description must be atleast 50 characters long.'],
  [{ title: 'T', description: false }, 'Description must be atleast 50 characters long.'],
  [{ title: 'T', description: [] }, null],
  [{ title: 'T', description: [''] }, 'Description must be atleast 50 characters long.'],
  [{ title: 'T', description: ['x'] }, 'Description must be atleast 50 characters long.'],
  [{ title: 'T', description: ['x', ''] }, 'Description must be atleast 50 characters long.'],
  [{ title: 'T', description: [['x']] }, 'Description must be atleast 50 characters long.'],
  [{ title: 'T', description: {} }, 'Description must be atleast 50 characters long.'],
  [{ title: 'T', description: { a: 1 } }, 'Description must be atleast 50 characters long.'],
  [
    { title: 'T', description: { toString: 'x' } },
    'Description must be atleast 50 characters long.',
  ],
  [
    {
      title: 'T',
      description:
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    },
    null,
  ],
  [
    { title: 'T', description: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
    'Description must be atleast 50 characters long.',
  ],
  [{ title: 'T', description: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }, null],
  [
    {
      title: 'T',
      description:
        '????????????????????????????????????????????????????????????????????????????????????????????????????',
    },
    null,
  ],
  [
    {
      title: 'T',
      description:
        '??????????????????????????????????????????????????????????????????????????????????????????????????',
    },
    null,
  ],
  [{ title: 'T', description: ['aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'] }, null],
  [
    { title: 'T', description: ['aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'short'] },
    'Description must be atleast 50 characters long.',
  ],
  [{ title: null, description: null }, 'Title is required.'],
  [{ title: '', description: '' }, 'Title is required.'],
  [{ title: ' ', description: ' ' }, 'Description must be atleast 50 characters long.'],
  [{ title: '   x   ', description: '   x   ' }, 'Description must be atleast 50 characters long.'],
  [{ title: 'x', description: 'x' }, 'Description must be atleast 50 characters long.'],
  [{ title: 5, description: 5 }, 'Description must be atleast 50 characters long.'],
  [{ title: 0, description: 0 }, 'Description must be atleast 50 characters long.'],
  [{ title: true, description: true }, 'Description must be atleast 50 characters long.'],
  [{ title: false, description: false }, 'Description must be atleast 50 characters long.'],
  [{ title: [], description: [] }, null],
  [{ title: [''], description: [''] }, 'Title is required.'],
  [{ title: ['x'], description: ['x'] }, 'Description must be atleast 50 characters long.'],
  [{ title: ['x', ''], description: ['x', ''] }, 'Title is required.'],
  [{ title: [['x']], description: [['x']] }, 'Description must be atleast 50 characters long.'],
  [{ title: {}, description: {} }, 'Description must be atleast 50 characters long.'],
  [{ title: { a: 1 }, description: { a: 1 } }, 'Description must be atleast 50 characters long.'],
  [
    { title: { toString: 'x' }, description: { toString: 'x' } },
    'Description must be atleast 50 characters long.',
  ],
  [
    {
      title:
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      description:
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    },
    null,
  ],
];

export const updatePost: readonly Row[] = [
  [{}, 'Title is required.'],
  [{ title: 'T', description: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }, null],
  [{ description: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }, 'Title is required.'],
  [
    { title: null, description: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
    'Title is required.',
  ],
  [
    { title: '', description: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
    'Title is required.',
  ],
  [{ title: ' ', description: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }, null],
  [{ title: '   x   ', description: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }, null],
  [{ title: 'x', description: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }, null],
  [{ title: 5, description: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }, null],
  [{ title: 0, description: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }, null],
  [{ title: true, description: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }, null],
  [{ title: false, description: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }, null],
  [{ title: [], description: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }, null],
  [
    { title: [''], description: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
    'Title is required.',
  ],
  [{ title: ['x'], description: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }, null],
  [
    { title: ['x', ''], description: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
    'Title is required.',
  ],
  [{ title: [['x']], description: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }, null],
  [{ title: {}, description: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }, null],
  [{ title: { a: 1 }, description: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }, null],
  [
    { title: { toString: 'x' }, description: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
    null,
  ],
  [
    {
      title:
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      description: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    },
    null,
  ],
  [{ title: 'T' }, 'Description must be atleast 50 characters long.'],
  [{ title: 'T', description: null }, 'Description must be atleast 50 characters long.'],
  [{ title: 'T', description: '' }, 'Description must be atleast 50 characters long.'],
  [{ title: 'T', description: ' ' }, 'Description must be atleast 50 characters long.'],
  [{ title: 'T', description: '   x   ' }, 'Description must be atleast 50 characters long.'],
  [{ title: 'T', description: 'x' }, 'Description must be atleast 50 characters long.'],
  [{ title: 'T', description: 5 }, 'Description must be atleast 50 characters long.'],
  [{ title: 'T', description: 0 }, 'Description must be atleast 50 characters long.'],
  [{ title: 'T', description: true }, 'Description must be atleast 50 characters long.'],
  [{ title: 'T', description: false }, 'Description must be atleast 50 characters long.'],
  [{ title: 'T', description: [] }, null],
  [{ title: 'T', description: [''] }, 'Description must be atleast 50 characters long.'],
  [{ title: 'T', description: ['x'] }, 'Description must be atleast 50 characters long.'],
  [{ title: 'T', description: ['x', ''] }, 'Description must be atleast 50 characters long.'],
  [{ title: 'T', description: [['x']] }, 'Description must be atleast 50 characters long.'],
  [{ title: 'T', description: {} }, 'Description must be atleast 50 characters long.'],
  [{ title: 'T', description: { a: 1 } }, 'Description must be atleast 50 characters long.'],
  [
    { title: 'T', description: { toString: 'x' } },
    'Description must be atleast 50 characters long.',
  ],
  [
    {
      title: 'T',
      description:
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    },
    null,
  ],
  [
    { title: 'T', description: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
    'Description must be atleast 50 characters long.',
  ],
  [
    { title: 'T', description: ['x', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'] },
    'Description must be atleast 50 characters long.',
  ],
  [{ title: null, description: null }, 'Title is required.'],
  [{ title: '', description: '' }, 'Title is required.'],
  [{ title: ' ', description: ' ' }, 'Description must be atleast 50 characters long.'],
  [{ title: '   x   ', description: '   x   ' }, 'Description must be atleast 50 characters long.'],
  [{ title: 'x', description: 'x' }, 'Description must be atleast 50 characters long.'],
  [{ title: 5, description: 5 }, 'Description must be atleast 50 characters long.'],
  [{ title: 0, description: 0 }, 'Description must be atleast 50 characters long.'],
  [{ title: true, description: true }, 'Description must be atleast 50 characters long.'],
  [{ title: false, description: false }, 'Description must be atleast 50 characters long.'],
  [{ title: [], description: [] }, null],
  [{ title: [''], description: [''] }, 'Title is required.'],
  [{ title: ['x'], description: ['x'] }, 'Description must be atleast 50 characters long.'],
  [{ title: ['x', ''], description: ['x', ''] }, 'Title is required.'],
  [{ title: [['x']], description: [['x']] }, 'Description must be atleast 50 characters long.'],
  [{ title: {}, description: {} }, 'Description must be atleast 50 characters long.'],
  [{ title: { a: 1 }, description: { a: 1 } }, 'Description must be atleast 50 characters long.'],
  [
    { title: { toString: 'x' }, description: { toString: 'x' } },
    'Description must be atleast 50 characters long.',
  ],
  [
    {
      title:
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      description:
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    },
    null,
  ],
];

export const addComment: readonly Row[] = [
  [{}, 'A comment is required.'],
  [{ comment: 'hi' }, null],
  [{ comment: null }, 'A comment is required.'],
  [{ comment: '' }, 'A comment is required.'],
  [{ comment: ' ' }, null],
  [{ comment: '   x   ' }, null],
  [{ comment: 'x' }, null],
  [{ comment: 5 }, null],
  [{ comment: 0 }, null],
  [{ comment: true }, null],
  [{ comment: false }, null],
  [{ comment: [] }, null],
  [{ comment: [''] }, 'A comment is required.'],
  [{ comment: ['x'] }, null],
  [{ comment: ['x', ''] }, 'A comment is required.'],
  [{ comment: [['x']] }, null],
  [{ comment: {} }, null],
  [{ comment: { a: 1 } }, null],
  [{ comment: { toString: 'x' } }, null],
  [
    {
      comment:
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    },
    null,
  ],
];

export const updateMe: readonly Row[] = [
  [{}, 'Name is required'],
  [{ name: 'Ann' }, null],
  [{ name: null }, 'Name is required'],
  [{ name: '' }, 'Name is required'],
  [{ name: ' ' }, null],
  [{ name: '   x   ' }, null],
  [{ name: 'x' }, null],
  [{ name: 5 }, null],
  [{ name: 0 }, null],
  [{ name: true }, null],
  [{ name: false }, null],
  [{ name: [] }, null],
  [{ name: [''] }, 'Name is required'],
  [{ name: ['x'] }, null],
  [{ name: ['x', ''] }, 'Name is required'],
  [{ name: [['x']] }, null],
  [{ name: {} }, null],
  [{ name: { a: 1 } }, null],
  [{ name: { toString: 'x' } }, null],
  [
    {
      name: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    },
    null,
  ],
];

export const updateSocials: readonly Row[] = [
  [{}, null],
  [{ facebook: 'https://facebook.com/a' }, null],
  [{ facebook: null }, null],
  [{ facebook: '' }, null],
  [{ facebook: ' ' }, 'facebook link must be a valid https URL'],
  [{ facebook: '   x   ' }, 'facebook link must be a valid https URL'],
  [{ facebook: 'x' }, 'facebook link must be a valid https URL'],
  [{ facebook: 5 }, 'facebook link must be a text value'],
  [{ facebook: 0 }, null],
  [{ facebook: true }, 'facebook link must be a text value'],
  [{ facebook: false }, null],
  [{ facebook: [] }, 'facebook link must be a text value'],
  [{ facebook: [''] }, 'facebook link must be a text value'],
  [{ facebook: ['x'] }, 'facebook link must be a text value'],
  [{ facebook: ['x', ''] }, 'facebook link must be a text value'],
  [{ facebook: [['x']] }, 'facebook link must be a text value'],
  [{ facebook: {} }, 'facebook link must be a text value'],
  [{ facebook: { a: 1 } }, 'facebook link must be a text value'],
  [{ facebook: { toString: 'x' } }, 'facebook link must be a text value'],
  [
    {
      facebook:
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    },
    'facebook link must be at most 200 characters',
  ],
  [{ facebook: 'https://x.test' }, null],
  [{ facebook: 'http://x.test' }, 'facebook link must be a valid https URL'],
  [{ facebook: 'javascript:alert(1)' }, 'facebook link must be a valid https URL'],
  [{ facebook: 'https://' }, 'facebook link must be a valid https URL'],
  [{ facebook: 'ftp://x.test' }, 'facebook link must be a valid https URL'],
  [{ facebook: 'x.test' }, 'facebook link must be a valid https URL'],
  [
    {
      facebook:
        'https://x.test/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    },
    'facebook link must be at most 200 characters',
  ],
  [
    {
      facebook:
        'https://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    },
    'facebook link must be at most 200 characters',
  ],
  [{ facebook: ' https://x.test' }, 'facebook link must be a valid https URL'],
  [{ facebook: 'HTTPS://X.TEST' }, null],
  [{ facebook: 'https://localhost' }, 'facebook link must be a valid https URL'],
  [{ facebook: 'https://x.test:99999' }, 'facebook link must be a valid https URL'],
  [{ facebook: 'https://a b.test' }, 'facebook link must be a valid https URL'],
  [{ facebook: 'data:text/html,x' }, 'facebook link must be a valid https URL'],
  [{ facebook: 'https://facebook.com/a', linkedin: null }, null],
  [{ facebook: 'https://facebook.com/a', linkedin: '' }, null],
  [
    { facebook: 'https://facebook.com/a', linkedin: ' ' },
    'linkedin link must be a valid https URL',
  ],
  [
    { facebook: 'https://facebook.com/a', linkedin: '   x   ' },
    'linkedin link must be a valid https URL',
  ],
  [
    { facebook: 'https://facebook.com/a', linkedin: 'x' },
    'linkedin link must be a valid https URL',
  ],
  [{ facebook: 'https://facebook.com/a', linkedin: 5 }, 'linkedin link must be a text value'],
  [{ facebook: 'https://facebook.com/a', linkedin: 0 }, null],
  [{ facebook: 'https://facebook.com/a', linkedin: true }, 'linkedin link must be a text value'],
  [{ facebook: 'https://facebook.com/a', linkedin: false }, null],
  [{ facebook: 'https://facebook.com/a', linkedin: [] }, 'linkedin link must be a text value'],
  [{ facebook: 'https://facebook.com/a', linkedin: [''] }, 'linkedin link must be a text value'],
  [{ facebook: 'https://facebook.com/a', linkedin: ['x'] }, 'linkedin link must be a text value'],
  [
    { facebook: 'https://facebook.com/a', linkedin: ['x', ''] },
    'linkedin link must be a text value',
  ],
  [{ facebook: 'https://facebook.com/a', linkedin: [['x']] }, 'linkedin link must be a text value'],
  [{ facebook: 'https://facebook.com/a', linkedin: {} }, 'linkedin link must be a text value'],
  [
    { facebook: 'https://facebook.com/a', linkedin: { a: 1 } },
    'linkedin link must be a text value',
  ],
  [
    { facebook: 'https://facebook.com/a', linkedin: { toString: 'x' } },
    'linkedin link must be a text value',
  ],
  [
    {
      facebook: 'https://facebook.com/a',
      linkedin:
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    },
    'linkedin link must be at most 200 characters',
  ],
  [{ facebook: 'https://facebook.com/a', linkedin: 'https://x.test' }, null],
  [
    { facebook: 'https://facebook.com/a', linkedin: 'http://x.test' },
    'linkedin link must be a valid https URL',
  ],
  [
    { facebook: 'https://facebook.com/a', linkedin: 'javascript:alert(1)' },
    'linkedin link must be a valid https URL',
  ],
  [
    { facebook: 'https://facebook.com/a', linkedin: 'https://' },
    'linkedin link must be a valid https URL',
  ],
  [
    { facebook: 'https://facebook.com/a', linkedin: 'ftp://x.test' },
    'linkedin link must be a valid https URL',
  ],
  [
    { facebook: 'https://facebook.com/a', linkedin: 'x.test' },
    'linkedin link must be a valid https URL',
  ],
  [
    {
      facebook: 'https://facebook.com/a',
      linkedin:
        'https://x.test/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    },
    'linkedin link must be at most 200 characters',
  ],
  [
    {
      facebook: 'https://facebook.com/a',
      linkedin:
        'https://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    },
    'linkedin link must be at most 200 characters',
  ],
  [
    { facebook: 'https://facebook.com/a', linkedin: ' https://x.test' },
    'linkedin link must be a valid https URL',
  ],
  [{ facebook: 'https://facebook.com/a', linkedin: 'HTTPS://X.TEST' }, null],
  [
    { facebook: 'https://facebook.com/a', linkedin: 'https://localhost' },
    'linkedin link must be a valid https URL',
  ],
  [
    { facebook: 'https://facebook.com/a', linkedin: 'https://x.test:99999' },
    'linkedin link must be a valid https URL',
  ],
  [
    { facebook: 'https://facebook.com/a', linkedin: 'https://a b.test' },
    'linkedin link must be a valid https URL',
  ],
  [
    { facebook: 'https://facebook.com/a', linkedin: 'data:text/html,x' },
    'linkedin link must be a valid https URL',
  ],
  [{ facebook: 'https://facebook.com/a', twitter: null }, null],
  [{ facebook: 'https://facebook.com/a', twitter: '' }, null],
  [{ facebook: 'https://facebook.com/a', twitter: ' ' }, 'twitter link must be a valid https URL'],
  [
    { facebook: 'https://facebook.com/a', twitter: '   x   ' },
    'twitter link must be a valid https URL',
  ],
  [{ facebook: 'https://facebook.com/a', twitter: 'x' }, 'twitter link must be a valid https URL'],
  [{ facebook: 'https://facebook.com/a', twitter: 5 }, 'twitter link must be a text value'],
  [{ facebook: 'https://facebook.com/a', twitter: 0 }, null],
  [{ facebook: 'https://facebook.com/a', twitter: true }, 'twitter link must be a text value'],
  [{ facebook: 'https://facebook.com/a', twitter: false }, null],
  [{ facebook: 'https://facebook.com/a', twitter: [] }, 'twitter link must be a text value'],
  [{ facebook: 'https://facebook.com/a', twitter: [''] }, 'twitter link must be a text value'],
  [{ facebook: 'https://facebook.com/a', twitter: ['x'] }, 'twitter link must be a text value'],
  [{ facebook: 'https://facebook.com/a', twitter: ['x', ''] }, 'twitter link must be a text value'],
  [{ facebook: 'https://facebook.com/a', twitter: [['x']] }, 'twitter link must be a text value'],
  [{ facebook: 'https://facebook.com/a', twitter: {} }, 'twitter link must be a text value'],
  [{ facebook: 'https://facebook.com/a', twitter: { a: 1 } }, 'twitter link must be a text value'],
  [
    { facebook: 'https://facebook.com/a', twitter: { toString: 'x' } },
    'twitter link must be a text value',
  ],
  [
    {
      facebook: 'https://facebook.com/a',
      twitter:
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    },
    'twitter link must be at most 200 characters',
  ],
  [{ facebook: 'https://facebook.com/a', twitter: 'https://x.test' }, null],
  [
    { facebook: 'https://facebook.com/a', twitter: 'http://x.test' },
    'twitter link must be a valid https URL',
  ],
  [
    { facebook: 'https://facebook.com/a', twitter: 'javascript:alert(1)' },
    'twitter link must be a valid https URL',
  ],
  [
    { facebook: 'https://facebook.com/a', twitter: 'https://' },
    'twitter link must be a valid https URL',
  ],
  [
    { facebook: 'https://facebook.com/a', twitter: 'ftp://x.test' },
    'twitter link must be a valid https URL',
  ],
  [
    { facebook: 'https://facebook.com/a', twitter: 'x.test' },
    'twitter link must be a valid https URL',
  ],
  [
    {
      facebook: 'https://facebook.com/a',
      twitter:
        'https://x.test/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    },
    'twitter link must be at most 200 characters',
  ],
  [
    {
      facebook: 'https://facebook.com/a',
      twitter:
        'https://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    },
    'twitter link must be at most 200 characters',
  ],
  [
    { facebook: 'https://facebook.com/a', twitter: ' https://x.test' },
    'twitter link must be a valid https URL',
  ],
  [{ facebook: 'https://facebook.com/a', twitter: 'HTTPS://X.TEST' }, null],
  [
    { facebook: 'https://facebook.com/a', twitter: 'https://localhost' },
    'twitter link must be a valid https URL',
  ],
  [
    { facebook: 'https://facebook.com/a', twitter: 'https://x.test:99999' },
    'twitter link must be a valid https URL',
  ],
  [
    { facebook: 'https://facebook.com/a', twitter: 'https://a b.test' },
    'twitter link must be a valid https URL',
  ],
  [
    { facebook: 'https://facebook.com/a', twitter: 'data:text/html,x' },
    'twitter link must be a valid https URL',
  ],
  [{ facebook: null, linkedin: null, twitter: null }, null],
  [{ facebook: '', linkedin: '', twitter: '' }, null],
  [{ facebook: ' ', linkedin: ' ', twitter: ' ' }, 'facebook link must be a valid https URL'],
  [
    { facebook: '   x   ', linkedin: '   x   ', twitter: '   x   ' },
    'facebook link must be a valid https URL',
  ],
  [{ facebook: 'x', linkedin: 'x', twitter: 'x' }, 'facebook link must be a valid https URL'],
  [{ facebook: 5, linkedin: 5, twitter: 5 }, 'facebook link must be a text value'],
  [{ facebook: 0, linkedin: 0, twitter: 0 }, null],
  [{ facebook: true, linkedin: true, twitter: true }, 'facebook link must be a text value'],
  [{ facebook: false, linkedin: false, twitter: false }, null],
  [{ facebook: [], linkedin: [], twitter: [] }, 'facebook link must be a text value'],
  [{ facebook: [''], linkedin: [''], twitter: [''] }, 'facebook link must be a text value'],
  [{ facebook: ['x'], linkedin: ['x'], twitter: ['x'] }, 'facebook link must be a text value'],
  [
    { facebook: ['x', ''], linkedin: ['x', ''], twitter: ['x', ''] },
    'facebook link must be a text value',
  ],
  [
    { facebook: [['x']], linkedin: [['x']], twitter: [['x']] },
    'facebook link must be a text value',
  ],
  [{ facebook: {}, linkedin: {}, twitter: {} }, 'facebook link must be a text value'],
  [
    { facebook: { a: 1 }, linkedin: { a: 1 }, twitter: { a: 1 } },
    'facebook link must be a text value',
  ],
  [
    { facebook: { toString: 'x' }, linkedin: { toString: 'x' }, twitter: { toString: 'x' } },
    'facebook link must be a text value',
  ],
  [
    {
      facebook:
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      linkedin:
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      twitter:
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    },
    'facebook link must be at most 200 characters',
  ],
];
