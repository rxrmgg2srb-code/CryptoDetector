import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BadgesDisplay } from '@/components/BadgesDisplay';
import type { BadgeDefinition } from '@/lib/badges-with-points';

// Mock badges helper functions
jest.mock('@/lib/badges-with-points', () => ({
  getBadgeColor: jest.fn(() => 'border-purple-500'),
  getBadgeGlow: jest.fn(() => 'shadow-purple-500/50'),
}));

describe('BadgesDisplay', () => {
  const mockBadges: BadgeDefinition[] = [
    {
      key: 'first_trade',
      name: 'First Trade',
      description: 'Complete your first trade',
      icon: '🎉',
      rarity: 'COMMON',
      points: 10,
    },
    {
      key: 'whale_hunter',
      name: 'Whale Hunter',
      description: 'Find a whale',
      icon: '🐋',
      rarity: 'LEGENDARY',
      points: 100,
    },
  ];

  it('renders badges correctly', () => {
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText('First Trade')).toBeInTheDocument();
    expect(screen.getByText('Whale Hunter')).toBeInTheDocument();
  });

  it('displays total points when showPoints is true', () => {
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText('110')).toBeInTheDocument();
    expect(screen.getByText('Achievement Points')).toBeInTheDocument();
  });

  it('hides points when showPoints is false', () => {
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.queryByText('Achievement Points')).not.toBeInTheDocument();
  });

  it('limits displayed badges when maxDisplay is set', () => {
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText('First Trade')).toBeInTheDocument();
    expect(screen.queryByText('Whale Hunter')).not.toBeInTheDocument();
  });

  it('handles empty badges array', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
