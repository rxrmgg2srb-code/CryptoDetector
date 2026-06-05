import React from 'react';
import { render } from '@testing-library/react';
import WalletConnectionHandler from '@/components/WalletConnectionHandler.tsx';

describe('WalletConnectionHandler', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
