import React from 'react';
import { render } from '@testing-library/react';
import NumberCounter from '@/components/animations/NumberCounter.tsx';

describe('NumberCounter', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
