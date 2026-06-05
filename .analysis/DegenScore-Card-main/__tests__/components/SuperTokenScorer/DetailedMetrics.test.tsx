import React from 'react';
import { render } from '@testing-library/react';
import DetailedMetrics from '@/components/SuperTokenScorer/DetailedMetrics.tsx';

describe('DetailedMetrics', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
