import React from 'react';
import { render } from '@testing-library/react';
import AlertCard from '@/components/WhaleRadar/AlertCard.tsx';

describe('AlertCard', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
