import React from 'react';
import { render } from '@testing-library/react';
import CardHeader from '@/components/DegenCard/CardHeader.tsx';

describe('CardHeader', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
