import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import Footer from './Footer';

afterEach(cleanup);

describe('Footer', () => {
  const renderFooter = () =>
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

  it('links to real pages and the project repository', () => {
    renderFooter();
    expect(screen.getByRole('link', { name: 'All Posts' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'All Users' })).toHaveAttribute('href', '/users');
    expect(screen.getByRole('link', { name: 'Popular Posts' })).toHaveAttribute('href', '/most-popular-posts');
    const github = screen.getByRole('link', { name: 'GitHub' });
    expect(github).toHaveAttribute('href', 'https://github.com/JadeHendricks/mern-multi-user-blog');
    expect(github).toHaveAttribute('target', '_blank');
    expect(github.getAttribute('rel')).toContain('noopener');
  });

  it('has no placeholder links left', () => {
    renderFooter();
    for (const text of ['About us', 'Apps', 'Careers', 'Contact']) {
      expect(screen.queryByText(text)).toBeNull();
    }
  });

  it('names the logo', () => {
    renderFooter();
    expect(screen.getByRole('img', { name: 'Multi User Blog' })).toBeInTheDocument();
  });
});
