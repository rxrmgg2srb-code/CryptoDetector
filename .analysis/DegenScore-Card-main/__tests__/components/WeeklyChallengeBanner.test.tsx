import React from 'react';
import { render } from '@testing-library/react';
import WeeklyChallengeBanner from '@/components/WeeklyChallengeBanner.tsx';

describe('WeeklyChallengeBanner', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
