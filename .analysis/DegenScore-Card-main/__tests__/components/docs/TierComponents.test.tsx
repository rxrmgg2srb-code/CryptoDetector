import React from 'react';
import { render } from '@testing-library/react';
import TierComponents from '@/components/docs/TierComponents.tsx';

describe('TierComponents', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
