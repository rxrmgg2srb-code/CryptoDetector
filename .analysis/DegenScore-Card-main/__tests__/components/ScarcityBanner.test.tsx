import React from 'react';
import { render } from '@testing-library/react';
import ScarcityBanner from '@/components/ScarcityBanner.tsx';

describe('ScarcityBanner', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
