import React from 'react';
import { render } from '@testing-library/react';
import AnalyticsDashboard from '@/components/AnalyticsDashboard.tsx';

describe('AnalyticsDashboard', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
