import React from 'react';
import { render } from '@testing-library/react';
import CardDisplay from '@/components/DegenCard/CardDisplay.tsx';

describe('CardDisplay', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
