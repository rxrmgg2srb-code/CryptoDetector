import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { generateSessionToken } from '../lib/walletAuth';
import toast from 'react-hot-toast';
import { logger } from '../lib/logger';

interface FollowButtonProps {
  walletAddress: string;
  className?: string;
  showCounts?: boolean;
}

export default function FollowButton({
  walletAddress,
  className = '',
  showCounts = true,
}: FollowButtonProps) {
  const { publicKey } = useWallet();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Check follow status when component mounts
  useEffect(() => {
    if (publicKey && walletAddress && publicKey.toBase58() !== walletAddress) {
      checkFollowStatus();
    }
  }, [publicKey, walletAddress]);

  // Generate session token when wallet connects
  useEffect(() => {
    if (publicKey) {
      generateToken();
    }
  }, [publicKey]);

  const generateToken = () => {
    if (!publicKey) {
      return;
    }

    try {
      const token = generateSessionToken(publicKey.toBase58());
      setSessionToken(token);
    } catch (error) {
      logger.error('Failed to generate session token:', error as Error);
    }
  };

  const checkFollowStatus = async () => {
    if (!publicKey || !sessionToken) {
      return;
    }

    try {
      const response = await fetch(`/api/follows/status?walletAddress=${walletAddress}`, {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.isFollowing);
        setFollowersCount(data.counts.followers);
        setFollowingCount(data.counts.following);
      }
    } catch (error) {
      logger.error('Error checking follow status:', error as Error);
    }
  };

  const handleFollow = async () => {
    if (!publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!sessionToken) {
      toast.error('Authenticating...');
      generateToken();
      return;
    }

    if (publicKey.toBase58() === walletAddress) {
      toast.error('Cannot follow yourself');
      return;
    }

    setLoading(true);

    try {
      if (isFollowing) {
        // Unfollow
        const response = await fetch('/api/follows/remove', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({ followingWallet: walletAddress }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to unfollow');
        }

        setIsFollowing(false);
        setFollowersCount((prev) => Math.max(0, prev - 1));
        toast.success('Unfollowed successfully');
      } else {
        // Follow
        const response = await fetch('/api/follows/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({ followingWallet: walletAddress }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to follow');
        }

        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
        toast.success('Following successfully');
      }
    } catch (error) {
      logger.error('Error toggling follow:', error as Error);
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Don't show button for own wallet
  if (publicKey && publicKey.toBase58() === walletAddress) {
    return null;
  }

  // Don't show button if not connected
  if (!publicKey) {
    return showCounts ? (
      <div className={`flex items-center gap-2 text-sm text-gray-400 ${className}`}>
        <span>👥 {followersCount} followers</span>
      </div>
    ) : null;
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showCounts && (
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <span>👥 {followersCount} followers</span>
          <span>·</span>
          <span>➡️ {followingCount} following</span>
        </div>
      )}

      <button
        onClick={handleFollow}
        disabled={loading}
        className={`px-4 py-2 rounded-lg font-medium transition ${
          isFollowing
            ? 'bg-gray-600 hover:bg-gray-700 text-white'
            : 'bg-purple-600 hover:bg-purple-700 text-white'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {loading ? '...' : isFollowing ? '✓ Following' : '+ Follow'}
      </button>
    </div>
  );
}
