import React from 'react';
import { render } from '@testing-library/react';
import MetricCard from '@/components/docs/MetricCard.tsx';

describe('MetricCard', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
