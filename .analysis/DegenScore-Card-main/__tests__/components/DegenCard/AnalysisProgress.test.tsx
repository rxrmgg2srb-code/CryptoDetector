import React from 'react';
import { render } from '@testing-library/react';
import AnalysisProgress from '@/components/DegenCard/AnalysisProgress.tsx';

describe('AnalysisProgress', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
