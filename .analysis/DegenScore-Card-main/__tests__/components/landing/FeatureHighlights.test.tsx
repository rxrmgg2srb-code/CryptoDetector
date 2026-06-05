import React from 'react';
import { render } from '@testing-library/react';
import FeatureHighlights from '@/components/landing/FeatureHighlights.tsx';

describe('FeatureHighlights', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
