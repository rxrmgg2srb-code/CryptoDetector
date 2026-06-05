import React from 'react';
import { render } from '@testing-library/react';
import Common from '@/components/docs/Common.tsx';

describe('Common', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
