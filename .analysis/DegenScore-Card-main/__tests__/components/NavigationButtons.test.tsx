import React from 'react';
import { render, screen } from '@testing-library/react';
import { NavigationButtons } from '@/components/NavigationButtons';

// Mock router
jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    pathname: '/',
    query: {},
    asPath: '/',
  })),
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

describe('NavigationButtons', () => {
  it('renders navigation buttons', () => {
    render(React.createElement('div', null, 'MockedComponent'));

    expect(screen.getByText('🏠 Home')).toBeInTheDocument();
    expect(screen.getByText('⚔️ Compare')).toBeInTheDocument();
    expect(screen.getByText('📚 Docs')).toBeInTheDocument();
    expect(screen.getByText('🏆 Leaderboard')).toBeInTheDocument();
  });

  it('renders with correct href attributes', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));

    const links = container.querySelectorAll('a');
    const hrefs = Array.from(links).map((link) => link.getAttribute('href'));

    expect(hrefs).toContain('/');
    expect(hrefs).toContain('/compare');
    expect(hrefs).toContain('/documentation');
    expect(hrefs).toContain('/leaderboard');
  });
});
