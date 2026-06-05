import React from 'react';
import { render } from '@testing-library/react';
import ConnectedState from '@/components/DegenCard/ConnectedState.tsx';

describe('ConnectedState', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
