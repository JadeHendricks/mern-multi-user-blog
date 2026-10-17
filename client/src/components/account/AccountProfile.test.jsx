import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AuthContext from '../../context/authContext/AuthContext';
import UserContext from '../../context/userContext/UserContext';
import Profile from './AccountProfile';

// B23: the account settings form copied props into state once, so showing a different user kept
// the previous user's name and socials in the form (and a save would have written them back).
const ann = { _id: 'u1', name: 'Ann', avatar: 'a.png', socials: { facebook: 'https://fb.test/ann' } };
const bob = { _id: 'u2', name: 'Bob', avatar: 'b.png', socials: { facebook: 'https://fb.test/bob' } };

const tree = user => (
  <AuthContext.Provider
    value={{
      loggedInUser: { _id: user._id, email: 'me@test.dev' },
      isUsersData: (a, b) => a === b,
      authLoading: false,
    }}
  >
    <UserContext.Provider
      value={{
        getAllUsersPosts: vi.fn(),
        getUser: vi.fn(),
        updateUser: vi.fn(),
        updateUserSocials: vi.fn(),
        user,
        userPosts: [],
        userLoading: false,
      }}
    >
      <MemoryRouter>
        <Profile match={{ params: { id: user._id } }} />
      </MemoryRouter>
    </UserContext.Provider>
  </AuthContext.Provider>
);

afterEach(cleanup);

describe('AccountProfile account settings form', () => {
  it('shows the new user values after the user changes', () => {
    const { rerender } = render(tree(ann));
    fireEvent.click(screen.getByRole('button', { name: 'Account settings' }));
    expect(screen.getByLabelText('Name')).toHaveValue('Ann');
    expect(screen.getByLabelText('Facebook URL')).toHaveValue('https://fb.test/ann');

    rerender(tree(bob));

    expect(screen.getByLabelText('Name')).toHaveValue('Bob');
    expect(screen.getByLabelText('Facebook URL')).toHaveValue('https://fb.test/bob');
  });
});
