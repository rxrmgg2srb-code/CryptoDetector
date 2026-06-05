import React from 'react';
import { render, screen } from '@testing-library/react';
import HeroButton from '@/components/HeroButton';

describe('HeroButton', () => {
  it('renders with default text', () => {
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText(/Mint Your DegenCard Now/)).toBeInTheDocument();
  });

  it('renders with custom text', () => {
    render(React.createElement('div', {}, 'MockedComponent'));
    expect(screen.getByText('Custom Text')).toBeInTheDocument();
  });

  it('renders with default href', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    const link = container.querySelector('a');
    expect(link).toHaveAttribute('href', '/api/generate-card');
  });

  it('renders with custom href', () => {
    const { container } = render(<HeroButton href="/custom-route">Test</HeroButton>);
    const link = container.querySelector('a');
    expect(link).toHaveAttribute('href', '/custom-route');
  });
});
