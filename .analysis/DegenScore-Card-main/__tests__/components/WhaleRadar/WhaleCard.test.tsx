import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import WhaleCard from '@/components/WhaleRadar/WhaleCard';

const mockWhale = {
  id: 'whale-123',
  walletAddress: '8x...1234',
  nickname: 'Big Whale',
  totalVolume: 1000000,
  winRate: 75,
  avgPositionSize: 5000,
  pnl: 250000,
  followersCount: 100,
  lastActive: new Date(),
  topTokens: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('WhaleCard', () => {
  const mockOnFollow = jest.fn();
  const mockOnUnfollow = jest.fn();

  it('renders whale information correctly', () => {
    render(
      <WhaleCard
        whale={mockWhale}
        isFollowing={false}
        onFollow={mockOnFollow}
        onUnfollow={mockOnUnfollow}
        isAuthenticated={true}
      />
    );
    expect(screen.getByText('Big Whale')).toBeInTheDocument();
    expect(screen.getByText('8x...1234')).toBeInTheDocument();
  });

  it('shows follow button when not following', () => {
    render(
      <WhaleCard
        whale={mockWhale}
        isFollowing={false}
        onFollow={mockOnFollow}
        onUnfollow={mockOnUnfollow}
        isAuthenticated={true}
      />
    );
    const button = screen.getByRole('button', { name: /\+ Follow/i });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(mockOnFollow).toHaveBeenCalledWith('whale-123');
  });

  it('shows unfollow button when following', () => {
    render(
      <WhaleCard
        whale={mockWhale}
        isFollowing={true}
        onFollow={mockOnFollow}
        onUnfollow={mockOnUnfollow}
        isAuthenticated={true}
      />
    );
    const button = screen.getByRole('button', { name: /Following/i });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(mockOnUnfollow).toHaveBeenCalledWith('whale-123');
  });

  it('disables button when not authenticated', () => {
    render(
      <WhaleCard
        whale={mockWhale}
        isFollowing={false}
        onFollow={mockOnFollow}
        onUnfollow={mockOnUnfollow}
        isAuthenticated={false}
      />
    );
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});
