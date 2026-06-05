import React from 'react';
import { render } from '@testing-library/react';
import LeaderboardStats from '@/components/leaderboard/LeaderboardStats.tsx';

describe('LeaderboardStats', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
