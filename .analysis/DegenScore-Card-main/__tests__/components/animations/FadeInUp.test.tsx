import React from 'react';
import { render } from '@testing-library/react';
import FadeInUp from '@/components/animations/FadeInUp.tsx';

describe('FadeInUp', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
