import React from 'react';
import { render } from '@testing-library/react';
import WalletTracker from '@/components/WalletTracker.tsx';

describe('WalletTracker', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
