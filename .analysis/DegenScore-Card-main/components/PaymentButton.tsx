import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { PAYMENT_CONFIG } from '../lib/config';
import { logger } from '@/lib/logger';

interface PaymentButtonProps {
  walletAddress: string;
  onPaymentSuccess: () => void;
}

export default function PaymentButton({ walletAddress, onPaymentSuccess }: PaymentButtonProps) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    if (!publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    setIsPaying(true);
    setError(null);

    try {
      logger.info('💰 Checking balance and fees...');

      // SEGURIDAD: Verificar balance antes de crear transacción
      const balance = await connection.getBalance(publicKey);
      const feeEstimate = 5000; // ~5000 lamports para transaction fee
      const paymentAmount = PAYMENT_CONFIG.MINT_PRICE_SOL * LAMPORTS_PER_SOL;
      const totalRequired = paymentAmount + feeEstimate;

      if (balance < totalRequired) {
        const shortfall = (totalRequired - balance) / LAMPORTS_PER_SOL;
        throw new Error(
          `Balance insuficiente. Necesitas ${(totalRequired / LAMPORTS_PER_SOL).toFixed(4)} SOL, ` +
            `pero solo tienes ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL. ` +
            `Faltan ${shortfall.toFixed(4)} SOL.`
        );
      }

      logger.info(`✅ Balance verificado: ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
      logger.info('💰 Creating payment transaction...');

      // Crear transacción de pago
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(PAYMENT_CONFIG.TREASURY_WALLET),
          lamports: paymentAmount,
        })
      );

      // Obtener blockhash reciente
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      logger.info('📤 Sending transaction...');

      // Enviar transacción
      const signature = await sendTransaction(transaction, connection);

      logger.info('⏳ Waiting for confirmation...', { signature });

      // SEGURIDAD: Wait for confirmation with timeout of 30 seconds
      const confirmationPromise = connection.confirmTransaction(signature, 'confirmed');
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Transaction confirmation timeout (30s)')), 30000)
      );

      const confirmation = await Promise.race([confirmationPromise, timeoutPromise]);

      if (confirmation.value.err) {
        throw new Error('Transaction failed on blockchain');
      }

      logger.info('✅ Transaction confirmed!');

      // Verificar pago en el backend
      logger.info('🔍 Verifying payment...');
      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          paymentSignature: signature,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Payment verification failed');
      }

      logger.info('🎉 Payment verified! Card minted!');
      onPaymentSuccess();
    } catch (err) {
      logger.error('❌ Payment error', err instanceof Error ? err : undefined, {
        error: String(err),
      });
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="space-y-4">
      {!publicKey ? (
        <div className="text-center">
          <p className="mb-4 text-gray-300">Connect your wallet to mint this card</p>
          <WalletMultiButton />
        </div>
      ) : (
        <div>
          <button
            onClick={handlePayment}
            disabled={isPaying}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-4 px-8 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
          >
            {isPaying ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing Payment...
              </span>
            ) : (
              `🎴 Mint Card for ${PAYMENT_CONFIG.MINT_PRICE_SOL} SOL`
            )}
          </button>

          <p className="text-center text-sm text-gray-400 mt-2">
            Price: {PAYMENT_CONFIG.MINT_PRICE_SOL} SOL (~$
            {(PAYMENT_CONFIG.MINT_PRICE_SOL * 150).toFixed(2)} USD)
          </p>

          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
