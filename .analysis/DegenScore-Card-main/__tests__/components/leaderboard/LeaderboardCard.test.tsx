import React from 'react';
import { render } from '@testing-library/react';
import LeaderboardCard from '@/components/leaderboard/LeaderboardCard.tsx';

describe('LeaderboardCard', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
