import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID (wallet address) is required' });
    }

    // Get user's streak information
    const userStreak = await prisma.userStreak.findUnique({
      where: { walletAddress: userId },
      select: {
        walletAddress: true,
        currentStreak: true,
        longestStreak: true,
        lastLoginDate: true,
      },
    });

    if (!userStreak) {
      // If no streak record exists, return default values
      return res.status(200).json({
        currentStreak: 0,
        longestStreak: 0,
        lastCheckIn: null,
        canCheckIn: true,
      });
    }

    // Check if user can check in today
    const lastCheckIn = userStreak.lastLoginDate ? new Date(userStreak.lastLoginDate) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let canCheckIn = true;
    if (lastCheckIn) {
      const lastCheckInDate = new Date(lastCheckIn);
      lastCheckInDate.setHours(0, 0, 0, 0);

      // If last check-in was today, they can't check in again
      if (lastCheckInDate.getTime() === today.getTime()) {
        canCheckIn = false;
      }
      // If last check-in was in the future (timezone weirdness), assume they can't
      if (lastCheckInDate > today) {
        canCheckIn = false;
      }
    }

    return res.status(200).json({
      currentStreak: userStreak.currentStreak || 0,
      longestStreak: userStreak.longestStreak || 0,
      lastCheckIn: userStreak.lastLoginDate,
      canCheckIn,
    });
  } catch (error) {
    console.error('Error fetching streak status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
