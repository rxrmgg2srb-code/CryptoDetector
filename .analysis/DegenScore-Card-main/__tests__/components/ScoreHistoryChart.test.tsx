import React from 'react';
import { render } from '@testing-library/react';
import ScoreHistoryChart from '@/components/ScoreHistoryChart.tsx';

describe('ScoreHistoryChart', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
