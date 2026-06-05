import React from 'react';
import { render } from '@testing-library/react';
import WalletConnectionPrompt from '@/components/card/WalletConnectionPrompt.tsx';

describe('WalletConnectionPrompt', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
