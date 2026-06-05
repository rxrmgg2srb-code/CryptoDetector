import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import WhaleRadar from '@/components/WhaleRadar';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWhaleRadar } from '@/hooks/useWhaleRadar';

// Mock dependencies
jest.mock('@solana/wallet-adapter-react', () => ({
  useWallet: jest.fn(),
}));

jest.mock('@/hooks/useWhaleRadar', () => ({
  useWhaleRadar: jest.fn(),
}));

// Mock sub-components to simplify testing
jest.mock('@/components/WhaleRadar/WhaleRadarHeader', () => ({
  __esModule: true,
  default: ({ activeTab, setActiveTab }: any) => (
    <div>
      <button onClick={() => setActiveTab('top')}>Top Whales</button>
      <button onClick={() => setActiveTab('following')}>Following</button>
      <button onClick={() => setActiveTab('alerts')}>Alerts</button>
    </div>
  ),
}));

jest.mock('@/components/WhaleRadar/WhaleCard', () => ({
  __esModule: true,
  default: ({ whale }: any) => <div>Whale: {whale.name}</div>,
}));

jest.mock('@/components/WhaleRadar/AlertCard', () => ({
  __esModule: true,
  default: ({ alert }: any) => <div>Alert: {alert.message}</div>,
}));

describe('WhaleRadar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useWallet as jest.Mock).mockReturnValue({ publicKey: null });
    (useWhaleRadar as jest.Mock).mockReturnValue({
      activeTab: 'top',
      setActiveTab: jest.fn(),
      topWhales: [],
      followedWhales: [],
      alerts: [],
      loading: false,
      sessionToken: null,
      handleFollow: jest.fn(),
      handleUnfollow: jest.fn(),
      isFollowing: jest.fn().mockReturnValue(false),
    });
  });

  it('renders loading state', () => {
    (useWhaleRadar as jest.Mock).mockReturnValue({
      ...useWhaleRadar(),
      loading: true,
      topWhales: [],
    });
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders top whales list', () => {
    (useWhaleRadar as jest.Mock).mockReturnValue({
      ...useWhaleRadar(),
      topWhales: [{ id: '1', name: 'Moby Dick' }],
    });
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText('Whale: Moby Dick')).toBeInTheDocument();
  });

  it('renders empty state for top whales', () => {
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText('No whales detected yet')).toBeInTheDocument();
  });

  it('renders connect wallet message for following tab when disconnected', () => {
    (useWhaleRadar as jest.Mock).mockReturnValue({
      ...useWhaleRadar(),
      activeTab: 'following',
    });
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText('Connect your wallet to follow whales')).toBeInTheDocument();
  });

  it('renders followed whales when connected', () => {
    (useWallet as jest.Mock).mockReturnValue({ publicKey: { toBase58: () => 'me' } });
    (useWhaleRadar as jest.Mock).mockReturnValue({
      ...useWhaleRadar(),
      activeTab: 'following',
      followedWhales: [{ id: '2', name: 'Friendly Whale' }],
    });
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText('Whale: Friendly Whale')).toBeInTheDocument();
  });

  it('renders alerts tab', () => {
    (useWallet as jest.Mock).mockReturnValue({ publicKey: { toBase58: () => 'me' } });
    (useWhaleRadar as jest.Mock).mockReturnValue({
      ...useWhaleRadar(),
      activeTab: 'alerts',
      alerts: [{ id: '1', message: 'Big Buy!' }],
    });
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText('Alert: Big Buy!')).toBeInTheDocument();
  });
});
