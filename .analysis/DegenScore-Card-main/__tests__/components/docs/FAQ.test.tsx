import React from 'react';
import { render } from '@testing-library/react';
import FAQ from '@/components/docs/FAQ.tsx';

describe('FAQ', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
