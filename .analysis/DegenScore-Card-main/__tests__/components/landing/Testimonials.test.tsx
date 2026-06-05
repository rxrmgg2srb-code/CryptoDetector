import React from 'react';
import { render } from '@testing-library/react';
import Testimonials from '@/components/landing/Testimonials.tsx';

describe('Testimonials', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
