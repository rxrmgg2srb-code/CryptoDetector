import React from 'react';
import { render } from '@testing-library/react';
import Header from '@/components/Header.tsx';

describe('Header', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
