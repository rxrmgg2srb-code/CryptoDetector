import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { PAYMENT_CONFIG, UPLOAD_CONFIG } from '../lib/config';
import { logger } from '@/lib/logger';

interface ProfileFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProfileData) => void;
  walletAddress: string;
  hasPromoCode?: boolean; // Si ya aplicó un código promocional
  promoCodeApplied?: string; // El código que se aplicó
}

export interface ProfileData {
  displayName: string;
  twitter: string;
  telegram: string;
  profileImage: string | null;
}

export default function ProfileFormModal({
  isOpen,
  onClose,
  onSubmit,
  walletAddress,
  hasPromoCode = false,
  promoCodeApplied,
}: ProfileFormModalProps) {
  const { publicKey, sendTransaction } = useWallet();
  const [formData, setFormData] = useState<ProfileData>({
    displayName: '',
    twitter: '',
    telegram: '',
    profileImage: null,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    // Validate size using config
    if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE) {
      const maxMb = Math.round(UPLOAD_CONFIG.MAX_FILE_SIZE / (1024 * 1024));
      alert(`Image must be less than ${maxMb} MB`);
      return;
    }

    // Validate type
    if (!file.type.startsWith('image/')) {
      alert('File must be an image');
      return;
    }

    setIsUploading(true);
    try {
      // Preview
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);

      // Upload to API
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('walletAddress', walletAddress);

      const response = await fetch('/api/upload-profile-image', {
        method: 'POST',
        body: formDataUpload,
        credentials: 'include', // Enviar cookies de autenticación
      });
      const data = await response.json();
      if (data.success) {
        setFormData({ ...formData, profileImage: data.imageUrl });
      } else {
        alert('Failed to upload image');
      }
    } catch (error) {
      logger.error('Error uploading image', error instanceof Error ? error : undefined, {
        error: String(error),
      });
      alert('Error uploading image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.displayName.trim()) {
      alert('Please enter your name');
      return;
    }

    if (hasPromoCode) {
      try {
        const response = await fetch('/api/update-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress, ...formData }),
        });
        if (!response.ok) {
          throw new Error('Failed to save profile');
        }
        onSubmit(formData);
      } catch (error: any) {
        alert('Error saving profile: ' + error.message);
      }
      return;
    }

    if (!publicKey) {
      alert('Please connect your wallet first');
      return;
    }

    setIsPaying(true);
    setPaymentError(null);
    try {
      const connection = new Connection(PAYMENT_CONFIG.SOLANA_NETWORK, 'confirmed');
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      const lamports = PAYMENT_CONFIG.MINT_PRICE_SOL * LAMPORTS_PER_SOL;
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(PAYMENT_CONFIG.TREASURY_WALLET),
          lamports,
        })
      );
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;
      const signature = await sendTransaction(transaction, connection);
      const confirmation = await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        'confirmed'
      );
      if (confirmation.value.err) {
        throw new Error('Transaction failed: ' + confirmation.value.err.toString());
      }

      const profileResponse = await fetch('/api/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress, ...formData }),
      });
      if (!profileResponse.ok) {
        throw new Error('Failed to save profile');
      }

      const paymentResponse = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentSignature: signature, walletAddress: publicKey.toString() }),
      });
      const paymentData = await paymentResponse.json();
      if (!paymentResponse.ok) {
        throw new Error(paymentData.error || 'Failed to verify payment');
      }

      // ✅ PAGO EXITOSO - Download automáticamente la tarjeta premium
      logger.info('✅ Payment successful, downloading premium card...');

      try {
        const imageUrl = `/api/generate-card?walletAddress=${encodeURIComponent(walletAddress)}`;
        const imageResponse = await fetch(imageUrl);

        if (imageResponse.ok) {
          const blob = await imageResponse.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `degenscore-premium-${walletAddress.slice(0, 8)}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          logger.info('✅ Premium card downloaded automatically');
        }
      } catch (downloadError) {
        logger.warn('Failed to auto-download card', downloadError as Error);
        // No bloqueamos el flujo si falla la descarga
      }

      onSubmit(formData);

      // Redirect to leaderboard after 1 segundo
      setTimeout(() => {
        window.location.href = '/leaderboard';
      }, 1000);
    } catch (error: any) {
      console.error('Payment error:', error);
      setPaymentError(error.message || 'Payment failed');
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border-2 border-cyan-500/50 shadow-2xl shadow-cyan-500/20 max-w-md w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
        >
          ✕
        </button>
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">🎨 Customize Your Card</h2>
          <p className="text-gray-400 text-sm">Add your info to make your card unique</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Profile Image Upload */}
          <div className="flex flex-col items-center">
            <label className="text-gray-300 text-sm font-medium mb-3">Profile Picture</label>
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-cyan-500/50 overflow-hidden bg-gray-800 flex items-center justify-center">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-gray-500 text-center">
                    <div className="text-4xl mb-2">📷</div>
                    <div className="text-xs">Upload</div>
                  </div>
                )}
              </div>
              <label
                htmlFor="profile-image"
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 hover:opacity-100 transition cursor-pointer"
              >
                <span className="text-white text-sm font-medium">
                  {isUploading ? 'Uploading...' : 'Change'}
                </span>
              </label>
              <input
                id="profile-image"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isUploading}
              />
            </div>
            <p className="text-gray-500 text-xs mt-2">
              Max {Math.round(UPLOAD_CONFIG.MAX_FILE_SIZE / (1024 * 1024))} MB • JPG, PNG, GIF
            </p>
          </div>

          {/* Display Name */}
          <div>
            <label className="text-gray-300 text-sm font-medium mb-2 block">Display Name *</label>
            <input
              type="text"
              placeholder="Your name or nickname"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition"
              maxLength={30}
              required
            />
          </div>

          {/* Twitter */}
          <div>
            <label className="text-gray-300 text-sm font-medium mb-2 block">
              Twitter (optional)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">@</span>
              <input
                type="text"
                placeholder="username"
                value={formData.twitter}
                onChange={(e) =>
                  setFormData({ ...formData, twitter: e.target.value.replace('@', '') })
                }
                className="w-full pl-8 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition"
                maxLength={200}
              />
            </div>
          </div>

          {/* Telegram */}
          <div>
            <label className="text-gray-300 text-sm font-medium mb-2 block">
              Telegram (optional)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">@</span>
              <input
                type="text"
                placeholder="username"
                value={formData.telegram}
                onChange={(e) =>
                  setFormData({ ...formData, telegram: e.target.value.replace('@', '') })
                }
                className="w-full pl-8 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition"
                maxLength={200}
              />
            </div>
          </div>

          {/* Payment Error */}
          {paymentError && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm">{paymentError}</p>
            </div>
          )}

          {/* Promo Code Badge */}
          {hasPromoCode && promoCodeApplied && (
            <div className="p-3 bg-green-500/10 border border-green-500/50 rounded-lg">
              <p className="text-green-400 text-sm flex items-center gap-2">
                <span>✅</span>
                <span>
                  Promo code <strong>{promoCodeApplied}</strong> applied - Premium FREE!
                </span>
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={isUploading || isPaying}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white rounded-lg font-bold transition disabled:opacity-50"
            >
              {isPaying ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
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
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Paying...
                </span>
              ) : hasPromoCode ? (
                'Save (FREE)'
              ) : (
                `Save & Pay ${PAYMENT_CONFIG.MINT_PRICE_SOL} SOL`
              )}
            </button>
          </div>
        </form>
        <p className="text-gray-500 text-xs text-center mt-4">
          This info will appear on your card and leaderboard
        </p>
      </div>
    </div>
  );
}
