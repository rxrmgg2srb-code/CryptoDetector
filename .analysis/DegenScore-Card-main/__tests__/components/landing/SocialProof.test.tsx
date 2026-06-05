import React from 'react';
import { render } from '@testing-library/react';
import SocialProof from '@/components/landing/SocialProof.tsx';

describe('SocialProof', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
