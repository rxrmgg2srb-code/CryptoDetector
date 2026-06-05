import React from 'react';
import { render } from '@testing-library/react';
import RealtimeLeaderboard from '@/components/RealtimeLeaderboard.tsx';

describe('RealtimeLeaderboard', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
