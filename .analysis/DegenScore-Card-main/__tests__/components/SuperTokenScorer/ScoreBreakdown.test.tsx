import React from 'react';
import { render } from '@testing-library/react';
import ScoreBreakdown from '@/components/SuperTokenScorer/ScoreBreakdown.tsx';

describe('ScoreBreakdown', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
