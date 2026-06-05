import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';
import { Connection } from '@solana/web3.js';
import { logger } from '@/lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { walletAddress, signature, amount } = req.body;

    logger.info('📥 Payment received:', { walletAddress, signature, amount });

    if (!walletAddress || !signature || !amount) {
      logger.error('❌ Missing fields', undefined, { walletAddress, signature, amount });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verificar la transacción en la blockchain DEVNET
    const connection = new Connection(
      process.env.NEXT_PUBLIC_HELIUS_RPC_URL || 'https://api.devnet.solana.com',
      'confirmed'
    );

    try {
      const tx = await connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0,
      });

      if (!tx) {
        logger.error('❌ Transaction not found:', signature);
        return res.status(400).json({ error: 'Transaction not found' });
      }

      // Verificar que la transacción fue exitosa
      if (tx.meta?.err) {
        logger.error('❌ Transaction failed', undefined, { transactionError: tx.meta.err });
        return res.status(400).json({ error: 'Transaction failed' });
      }

      logger.info('✅ Transaction verified:', { signature });
    } catch (error) {
      logger.error('❌ Error verifying transaction:', error instanceof Error ? error : undefined, {
        error: String(error),
      });
      return res.status(400).json({ error: 'Failed to verify transaction' });
    }

    // Use transaction to ensure atomicity and prevent duplicate payments
    const result = await prisma.$transaction(async (tx) => {
      // SECURITY: Check for duplicate payment signature to prevent replay attacks
      const existingPayment = await tx.payment.findUnique({
        where: { signature },
      });

      if (existingPayment) {
        logger.warn('⚠️ Duplicate payment signature detected:', {
          signature,
          existingPayment: existingPayment.id,
        });
        throw new Error('Payment signature already used. Possible replay attack.');
      }

      // Guardar el pago en la base de datos
      const payment = await tx.payment.create({
        data: {
          walletAddress,
          signature,
          amount: parseFloat(amount.toString()),
          status: 'confirmed',
        },
      });

      logger.info('✅ Payment saved:', { paymentId: payment.id });

      // Marcar la card como pagada
      const updatedCard = await tx.degenCard.update({
        where: { walletAddress },
        data: {
          isPaid: true,
          lastSeen: new Date(),
        },
      });

      logger.info('✅ Card marked as paid for wallet:', walletAddress);

      return { payment, card: updatedCard };
    });

    const { payment } = result;

    res.status(200).json({
      success: true,
      message: 'Payment recorded successfully',
      payment,
    });
  } catch (error) {
    // Handle duplicate payment signature error specifically
    if (error instanceof Error && error.message.includes('Payment signature already used')) {
      return res.status(400).json({
        error: 'Duplicate payment',
        details:
          'This payment signature has already been used. Please use a different transaction.',
      });
    }

    logger.error('❌ Error recording payment:', error instanceof Error ? error : undefined, {
      error: String(error),
    });
    res.status(500).json({
      error: 'Failed to record payment',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
