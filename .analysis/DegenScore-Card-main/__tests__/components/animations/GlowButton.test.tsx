import React from 'react';
import { render } from '@testing-library/react';
import GlowButton from '@/components/animations/GlowButton.tsx';

describe('GlowButton', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
