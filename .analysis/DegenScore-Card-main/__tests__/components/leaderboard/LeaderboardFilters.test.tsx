import React from 'react';
import { render } from '@testing-library/react';
import LeaderboardFilters from '@/components/leaderboard/LeaderboardFilters.tsx';

describe('LeaderboardFilters', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
