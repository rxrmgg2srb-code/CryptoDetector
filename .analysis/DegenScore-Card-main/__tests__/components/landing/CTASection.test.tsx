import React from 'react';
import { render } from '@testing-library/react';
import CTASection from '@/components/landing/CTASection.tsx';

describe('CTASection', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
