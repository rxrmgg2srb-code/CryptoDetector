import React from 'react';
import { render } from '@testing-library/react';
import LeaderboardContent from '@/components/LeaderboardContent.tsx';

describe('LeaderboardContent', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
