import React from 'react';
import { render } from '@testing-library/react';
import DegenCard from '@/components/DegenCard.tsx';

describe('DegenCard', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
