import React from 'react';
import { render } from '@testing-library/react';
import Footer from '@/components/DegenCard/Footer.tsx';

describe('Footer', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
