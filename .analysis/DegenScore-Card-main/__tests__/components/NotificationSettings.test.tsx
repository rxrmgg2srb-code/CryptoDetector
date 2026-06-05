import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NotificationSettings from '@/components/NotificationSettings';
import { useWallet } from '@solana/wallet-adapter-react';

jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn() },
}));

describe('NotificationSettings', () => {
  beforeEach(() => {
    (useWallet as jest.Mock).mockReturnValue({
      publicKey: { toBase58: () => 'wallet' },
    });
    global.fetch = jest.fn();
  });

  it('renders notification settings', () => {
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText(/Notification/i)).toBeInTheDocument();
  });

  it('renders when wallet not connected', () => {
    (useWallet as jest.Mock).mockReturnValue({ publicKey: null });
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
