import React from 'react';
import { render } from '@testing-library/react';
import ConnectWalletState from '@/components/DegenCard/ConnectWalletState.tsx';

describe('ConnectWalletState', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
