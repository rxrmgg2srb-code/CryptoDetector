import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { paymentRateLimit } from '../../lib/rateLimitRedis';
import { retry } from '../../lib/retryLogic';
import { logger } from '@/lib/logger';
import { redactWallet, redactSignature, sanitizeAmount } from '@/lib/sanitize';
import { getPaymentTypeFromAmount } from '@/lib/pricing';

import { PRICING } from '@/lib/pricing';

const TREASURY_WALLET = process.env.TREASURY_WALLET!;
// Minimum payment threshold (Renewal price with some tolerance)
const MIN_PAYMENT_SOL = PRICING.RENEWAL * 0.95;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Apply payment rate limiting to prevent abuse
  if (!(await paymentRateLimit(req, res))) {
    return;
  }

  try {
    const { walletAddress, paymentSignature } = req.body;

    if (!walletAddress || !paymentSignature) {
      return res.status(400).json({
        error: 'Missing walletAddress or paymentSignature',
      });
    }

    // ✅ SECURITY: Redact sensitive info in logs
    logger.info(`💰 Verifying payment for: ${redactWallet(walletAddress)}`);
    logger.info(`📝 Payment signature: ${redactSignature(paymentSignature)}`);

    const connection = new Connection(
      process.env.HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com',
      'confirmed'
    );

    // Retry transaction fetching to handle network issues
    // SEGURIDAD: Soportar todas las versiones de transacción (legacy y versioned)
    const txInfo = await retry(
      () =>
        connection.getTransaction(paymentSignature, {
          maxSupportedTransactionVersion: undefined, // Acepta cualquier versión
          commitment: 'confirmed',
        }),
      {
        maxRetries: 3,
        onRetry: (attempt, error) => {
          logger.warn(`[Payment] Retrying transaction fetch (attempt ${attempt}):`, {
            error: error.message,
          });
        },
      }
    );

    if (!txInfo) {
      return res.status(400).json({
        error: 'Transaction not found. Please wait a few seconds and try again.',
      });
    }

    const message = txInfo.transaction.message;
    const accountKeys = message.getAccountKeys();

    const treasuryPubkey = new PublicKey(TREASURY_WALLET);
    const senderPubkey = new PublicKey(walletAddress);

    // SECURITY: Verify sender is in the transaction
    let senderIndex = -1;
    let treasuryIndex = -1;

    for (let i = 0; i < accountKeys.length; i++) {
      const account = accountKeys.get(i);
      if (account && account.equals(senderPubkey)) {
        senderIndex = i;
      }
      if (account && account.equals(treasuryPubkey)) {
        treasuryIndex = i;
      }
    }

    if (senderIndex === -1) {
      return res.status(400).json({
        error: 'Wallet address not found in transaction. Possible fraud attempt.',
      });
    }

    if (treasuryIndex === -1) {
      return res.status(400).json({
        error: 'Treasury wallet not found in transaction.',
      });
    }

    // SECURITY: Verify that the sender LOST SOL (sent payment)
    // and treasury GAINED SOL (received payment)
    if (!txInfo.meta?.preBalances || !txInfo.meta?.postBalances) {
      return res.status(400).json({
        error: 'Transaction metadata incomplete. Cannot verify payment.',
      });
    }

    const senderBalanceChange =
      (txInfo.meta!.postBalances[senderIndex]! - txInfo.meta!.preBalances[senderIndex]!) /
      LAMPORTS_PER_SOL;

    const treasuryBalanceChange =
      (txInfo.meta!.postBalances[treasuryIndex]! - txInfo.meta!.preBalances[treasuryIndex]!) /
      LAMPORTS_PER_SOL;

    // Sender should have LOST at least MINT_PRICE_SOL (negative change)
    // Treasury should have GAINED at least MINT_PRICE_SOL (positive change)
    const senderPaidAmount = Math.abs(senderBalanceChange);
    const treasuryReceivedAmount = treasuryBalanceChange;

    // ✅ SECURITY: Redacted payment verification logs
    logger.info(`💰 Payment verification:`);
    logger.info(
      `   Sender (${redactWallet(walletAddress)}) balance change: ${sanitizeAmount(senderBalanceChange)}`
    );
    logger.info(`   Treasury balance change: ${sanitizeAmount(treasuryBalanceChange)}`);

    // CRITICAL VALIDATION: Sender must have sent money (negative balance change)
    if (senderBalanceChange >= 0) {
      // ✅ SECURITY: Generic error, detailed log
      logger.warn('Invalid payment - sender did not send SOL', {
        wallet: redactWallet(walletAddress),
        balanceChange: senderBalanceChange,
      });
      return res.status(400).json({
        error: 'Payment verification failed',
      });
    }

    // CRITICAL VALIDATION: Treasury must have received money (positive balance change)
    if (treasuryBalanceChange < MIN_PAYMENT_SOL) {
      // ✅ SECURITY: Generic error, detailed log
      logger.warn('Invalid payment - treasury received insufficient amount', {
        received: treasuryBalanceChange,
        expected: MIN_PAYMENT_SOL,
      });
      return res.status(400).json({
        error: 'Payment verification failed',
      });
    }

    // CRITICAL VALIDATION: Sender must have sent at least minimum tier price
    // (accounting for transaction fees, they might have sent slightly more)
    if (senderPaidAmount < MIN_PAYMENT_SOL) {
      // ✅ SECURITY: Generic error, detailed log
      logger.warn('Invalid payment - amount too low', {
        wallet: redactWallet(walletAddress),
        paid: senderPaidAmount,
        expected: MIN_PAYMENT_SOL,
      });
      return res.status(400).json({
        error: 'Payment verification failed',
      });
    }

    // 💎 Determine payment type
    const paidLamports = treasuryReceivedAmount * LAMPORTS_PER_SOL;
    const paymentType = getPaymentTypeFromAmount(paidLamports);

    if (!paymentType) {
      logger.warn('Invalid payment - amount does not match any pricing option', {
        wallet: redactWallet(walletAddress),
        paidLamports,
      });
      return res.status(400).json({
        error: 'Invalid payment amount.',
      });
    }

    const paidAmount = treasuryReceivedAmount;

    logger.info(`✅ Valid ${paymentType} payment received: ${sanitizeAmount(paidAmount)}`);

    // Use transaction to ensure atomicity and prevent race conditions
    const result = await prisma.$transaction(
      async (tx) => {
        // Check for duplicate payment signature
        const existingPayment = await tx.payment.findUnique({
          where: { signature: paymentSignature },
        });

        if (existingPayment) {
          throw new Error('Payment signature already used');
        }

        // Create payment record
        await tx.payment.create({
          data: {
            signature: paymentSignature,
            walletAddress,
            amount: paidAmount,
            status: 'confirmed',
            paymentType: paymentType,
          },
        });

        logger.info(`✅ Payment saved: ${redactSignature(paymentSignature)}`);

        // Update card as paid
        const updatedCard = await tx.degenCard.update({
          where: { walletAddress },
          data: {
            isMinted: true,
            mintedAt: new Date(),
            isPaid: true,
          },
        });

        // Determine subscription expiration
        const seasonDurationDays = 30; // Standard season length
        const seasonExpiresAt = new Date();
        seasonExpiresAt.setDate(seasonExpiresAt.getDate() + seasonDurationDays);

        // Update subscription based on payment type
        if (paymentType === 'ENTRY') {
          // ENTRY: Lifetime Access + 1 Season Free
          await tx.subscription.upsert({
            where: { walletAddress },
            create: {
              walletAddress,
              isLifetime: true,
              seasonExpiresAt: seasonExpiresAt,
              paymentSignature: paymentSignature,
              tier: 'PRO', // Legacy field compatibility
            },
            update: {
              isLifetime: true,
              seasonExpiresAt: seasonExpiresAt,
              paymentSignature: paymentSignature,
            },
          });
        } else {
          // RENEWAL: Extend Season Access
          // If user already has expiration in future, add days to it? Or just reset from now?
          // For simplicity, let's just reset from now for this MVP or extend if active.

          const currentSub = await tx.subscription.findUnique({ where: { walletAddress } });
          let newExpiry = new Date();

          if (currentSub?.seasonExpiresAt && currentSub.seasonExpiresAt > new Date()) {
            // If active, extend
            newExpiry = new Date(currentSub.seasonExpiresAt);
            newExpiry.setDate(newExpiry.getDate() + seasonDurationDays);
          } else {
            // If expired or new, set from now
            newExpiry = seasonExpiresAt;
          }

          await tx.subscription.upsert({
            where: { walletAddress },
            create: {
              walletAddress,
              seasonExpiresAt: newExpiry,
              paymentSignature: paymentSignature,
              tier: 'PRO', // Legacy field
              isLifetime: false, // Should have paid entry first, but if not, this gives season only
            },
            update: {
              seasonExpiresAt: newExpiry,
              paymentSignature: paymentSignature,
            },
          });
        }

        logger.info(
          `✅ Subscription updated (${paymentType})`
        );

        return updatedCard;
      },
      {
        maxWait: 5000, // 5 seconds max wait to acquire transaction lock
        timeout: 10000, // 10 seconds transaction timeout
      }
    );

    logger.info(`💎 Card status - isPaid: ${result.isPaid}, isMinted: ${result.isMinted}`);

    res.status(200).json({
      success: true,
      message: 'Payment verified and subscription activated',
      card: result,
      paymentType,
    });
  } catch (error) {
    logger.error('❌ Error verifying payment:', error instanceof Error ? error : undefined, {
      error: String(error),
    });

    // Handle specific error cases
    if (error instanceof Error && error.message === 'Payment signature already used') {
      return res.status(400).json({
        error: error.message,
      });
    }

    res.status(500).json({
      error: 'Failed to verify payment',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
