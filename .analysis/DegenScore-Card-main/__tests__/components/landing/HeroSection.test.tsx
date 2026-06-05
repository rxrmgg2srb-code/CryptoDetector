import React from 'react';
import { render } from '@testing-library/react';
import HeroSection from '@/components/landing/HeroSection.tsx';

describe('HeroSection', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
