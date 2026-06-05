import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Head from 'next/head';
import { Header } from '@/components/Header';
import FIFACard from '@/components/FIFACard';
import { logger } from '@/lib/logger';

// 🔒 Admin wallet con acceso exclusivo al modo espía
const ADMIN_WALLET = 'B7nB9QX1KC4QXp5GMxR8xzh3yzoqp6NjxSwfNBXtgPc1';

interface WalletCardData {
  walletAddress: string;
  displayName?: string;
  profileImage?: string;
  degenScore: number;
  tier: string;
  stats: {
    winRate: number;
    totalVolume: number;
    profitLoss: number;
    totalTrades: number;
    avgHoldTime?: number;
    level: number;
  };
  badges: any[];
  twitter?: string;
  telegram?: string;
}

interface ProfileFormData {
  displayName: string;
  twitter: string;
  telegram: string;
  profileImage: string | null;
}

export function SpyModeContent() {
  const { publicKey, connected } = useWallet();
  const [targetWallet, setTargetWallet] = useState('');
  const [cardData, setCardData] = useState<WalletCardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisData, setAnalysisData] = useState<any>(null); // Datos completos del análisis
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    displayName: '',
    twitter: '',
    telegram: '',
    profileImage: null,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Verificar si el usuario es el admin
  const isAdmin = connected && publicKey?.toBase58() === ADMIN_WALLET;

  const handleAnalyzeWallet = async () => {
    if (!targetWallet.trim()) {
      setError('Por favor ingresa una wallet address');
      return;
    }

    setLoading(true);
    setError('');
    setCardData(null);
    setAnalysisData(null);
    setSaveSuccess(false);
    setShowProfileForm(false);
    setProfileForm({
      displayName: '',
      twitter: '',
      telegram: '',
      profileImage: null,
    });
    setImagePreview(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: targetWallet.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al analizar la wallet');
      }

      // FIX: La API devuelve los datos directamente, no envueltos en data.metrics
      if (data && typeof data.degenScore === 'number') {
        const metrics = data; // La respuesta ES las métricas
        // Calcular tier basado en degenScore
        const getTier = (score: number) => {
          if (score >= 90) return 'Diamond';
          if (score >= 75) return 'Platinum';
          if (score >= 60) return 'Gold';
          if (score >= 45) return 'Silver';
          return 'Bronze';
        };

        // Guardar datos completos del análisis para usarlos al guardar
        setAnalysisData(metrics);

        setCardData({
          walletAddress: targetWallet.trim(),
          displayName: metrics.displayName || undefined,
          profileImage: metrics.profileImage || undefined,
          degenScore: metrics.degenScore || 0,
          tier: getTier(metrics.degenScore || 0),
          stats: {
            winRate: metrics.winRate || 0,
            totalVolume: metrics.totalVolume || 0,
            profitLoss: metrics.profitLoss || 0,
            totalTrades: metrics.totalTrades || 0,
            avgHoldTime: metrics.avgHoldTime,
            level: metrics.level || 1,
          },
          badges: metrics.badges || [],
          twitter: metrics.twitter,
          telegram: metrics.telegram,
        });

        // 🎯 NUEVO: Mostrar formulario automáticamente después del análisis
        setShowProfileForm(true);

        // Pre-llenar el formulario si ya hay datos guardados
        setProfileForm({
          displayName: metrics.displayName || '',
          twitter: metrics.twitter || '',
          telegram: metrics.telegram || '',
          profileImage: metrics.profileImage || null,
        });

        if (metrics.profileImage) {
          setImagePreview(metrics.profileImage);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error al analizar la wallet');
      console.error('Error analyzing wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen debe ser menor a 5MB');
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen');
      return;
    }

    setIsUploadingImage(true);
    setError('');

    try {
      // Preview local
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);

      // Upload to server
      const formData = new FormData();
      formData.append('file', file);
      formData.append('walletAddress', targetWallet);

      const response = await fetch('/api/upload-profile-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al subir la imagen');
      }

      setProfileForm({ ...profileForm, profileImage: data.imageUrl });
      logger.info('Image uploaded successfully', { imageUrl: data.imageUrl });
    } catch (err: any) {
      setError(err.message || 'Error al subir la imagen');
      logger.error('Error uploading image', err);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveToLeaderboard = async () => {
    if (!profileForm.displayName.trim()) {
      setError('El nombre es requerido');
      return;
    }

    if (!analysisData || !cardData) {
      setError('Primero debes analizar una wallet');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const response = await fetch('/api/spy-mode/save-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminWallet: publicKey?.toBase58(),
          targetWallet: targetWallet,
          analysisData: analysisData,
          profileData: profileForm,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar la card');
      }

      setSaveSuccess(true);
      setShowProfileForm(false);
      logger.info('Card saved successfully to leaderboard', { cardId: data.card?.id });

      // Resetear el formulario
      setTimeout(() => {
        setProfileForm({
          displayName: '',
          twitter: '',
          telegram: '',
          profileImage: null,
        });
        setImagePreview(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error al guardar la card');
      logger.error('Error saving card', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleAnalyzeWallet();
    }
  };

  return (
    <>
      <Head>
        <title>🕵️ Spy Mode - DegenScore</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white">
        <Header />

        <div className="container mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
              🕵️ Modo Espía
            </h1>
            <p className="text-xl text-gray-300">
              Analiza cualquier wallet de forma privada
            </p>
          </div>

          {/* Verificación de acceso */}
          {!connected ? (
            <div className="max-w-2xl mx-auto bg-gray-800/50 backdrop-blur-lg rounded-2xl p-12 text-center border border-purple-500/20">
              <div className="text-6xl mb-6">🔒</div>
              <h2 className="text-3xl font-bold mb-4">Acceso Restringido</h2>
              <p className="text-gray-300 mb-8">
                Conecta tu wallet para acceder al modo espía
              </p>
              <WalletMultiButton className="!bg-gradient-to-r !from-purple-500 !to-pink-500 hover:!from-purple-600 hover:!to-pink-600" />
            </div>
          ) : !isAdmin ? (
            <div className="max-w-2xl mx-auto bg-red-900/20 backdrop-blur-lg rounded-2xl p-12 text-center border border-red-500/50">
              <div className="text-6xl mb-6">⛔</div>
              <h2 className="text-3xl font-bold mb-4 text-red-400">
                Acceso Denegado
              </h2>
              <p className="text-gray-300 mb-4">
                Esta función está disponible solo para el administrador.
              </p>
              <p className="text-sm text-gray-500 font-mono">
                Tu wallet: {publicKey?.toBase58()}
              </p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              {/* Panel de búsqueda */}
              <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                  <p className="text-green-400 font-semibold">
                    Modo Espía Activado
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    🎯 Wallet Address del Influencer
                  </label>
                  <input
                    type="text"
                    value={targetWallet}
                    onChange={(e) => setTargetWallet(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ej: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
                    className="w-full px-4 py-3 bg-gray-900/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-mono text-sm"
                    disabled={loading}
                  />
                </div>

                {error && (
                  <div className="mb-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400">
                    ⚠️ {error}
                  </div>
                )}

                <button
                  onClick={handleAnalyzeWallet}
                  disabled={loading || !targetWallet.trim()}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg transition-all transform hover:scale-105 disabled:hover:scale-100"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Analizando wallet...</span>
                    </div>
                  ) : (
                    <span>🔍 Analizar Wallet</span>
                  )}
                </button>

                <p className="text-xs text-gray-500 mt-4 text-center">
                  💡 Esta información es privada y solo tú puedes verla
                </p>
              </div>

              {/* Card generada */}
              {cardData && (
                <div className="animate-fade-in">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-purple-400">
                      📊 Análisis Completo
                    </h3>
                    <p className="text-gray-400 text-sm mt-2">
                      Wallet: {cardData.walletAddress.slice(0, 8)}...
                      {cardData.walletAddress.slice(-8)}
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <FIFACard
                      rank={0}
                      walletAddress={cardData.walletAddress}
                      displayName={cardData.displayName}
                      profileImage={cardData.profileImage}
                      degenScore={cardData.degenScore}
                      tier={cardData.tier}
                      stats={cardData.stats}
                      badges={cardData.badges}
                      twitter={cardData.twitter}
                      telegram={cardData.telegram}
                    />
                  </div>

                  <div className="mt-8 bg-gray-800/30 rounded-lg p-6 border border-purple-500/10">
                    <h4 className="text-lg font-bold mb-4 text-purple-400">
                      📈 Estadísticas Detalladas
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">DegenScore</p>
                        <p className="text-2xl font-bold text-yellow-400">
                          {cardData.degenScore}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Win Rate</p>
                        <p className="text-2xl font-bold text-green-400">
                          {cardData.stats.winRate.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Total Trades</p>
                        <p className="text-2xl font-bold text-blue-400">
                          {cardData.stats.totalTrades}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Volume</p>
                        <p className="text-2xl font-bold text-purple-400">
                          {cardData.stats.totalVolume >= 1000
                            ? `${(cardData.stats.totalVolume / 1000).toFixed(1)}K SOL`
                            : `${cardData.stats.totalVolume.toFixed(2)} SOL`
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">P&L</p>
                        <p
                          className={`text-2xl font-bold ${cardData.stats.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}
                        >
                          {cardData.stats.profitLoss >= 0 ? '+' : ''}{cardData.stats.profitLoss.toFixed(2)} SOL
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Level</p>
                        <p className="text-2xl font-bold text-cyan-400">
                          {cardData.stats.level}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Mensaje de éxito */}
                  {saveSuccess && (
                    <div className="mt-6 p-6 bg-green-900/20 border border-green-500/50 rounded-lg text-center">
                      <div className="text-5xl mb-3">✅</div>
                      <h4 className="text-xl font-bold text-green-400 mb-2">
                        ¡Card Premium Guardada!
                      </h4>
                      <p className="text-gray-300">
                        La card se ha subido al leaderboard exitosamente
                      </p>
                      <a
                        href="/leaderboard"
                        className="inline-block mt-4 px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition"
                      >
                        Ver en Leaderboard
                      </a>
                    </div>
                  )}

                  {/* Formulario de perfil - Se muestra automáticamente */}
                  {!saveSuccess && showProfileForm && (
                    <div className="mt-8">
                      <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-green-500/20">
                        <h4 className="text-2xl font-bold text-green-400 mb-2 text-center">
                          📝 Personalizar Card del Influencer
                        </h4>
                        <p className="text-center text-gray-400 text-sm mb-6">
                          🎁 Gratis en modo espía - Añade los datos para crear la card perfecta
                        </p>

                        {/* Profile Image Upload */}
                        <div className="flex flex-col items-center mb-6">
                          <label className="text-gray-300 text-sm font-medium mb-3">
                            Foto de Perfil
                          </label>
                          <div className="relative">
                            <div className="w-32 h-32 rounded-full border-4 border-green-500/50 overflow-hidden bg-gray-800 flex items-center justify-center">
                              {imagePreview ? (
                                <img
                                  src={imagePreview}
                                  alt="Profile preview"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="text-gray-500 text-center">
                                  <div className="text-4xl mb-2">📷</div>
                                  <div className="text-xs">Subir</div>
                                </div>
                              )}
                            </div>
                            <label
                              htmlFor="spy-profile-image"
                              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 hover:opacity-100 transition cursor-pointer"
                            >
                              <span className="text-white text-sm font-bold">
                                {isUploadingImage ? '⏳' : '📸 Cambiar'}
                              </span>
                            </label>
                            <input
                              id="spy-profile-image"
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              disabled={isUploadingImage}
                              className="hidden"
                            />
                          </div>
                        </div>

                        {/* Form Fields */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-gray-300 text-sm font-medium mb-2">
                              Nombre del Influencer *
                            </label>
                            <input
                              type="text"
                              value={profileForm.displayName}
                              onChange={(e) =>
                                setProfileForm({ ...profileForm, displayName: e.target.value })
                              }
                              placeholder="Ej: CryptoGuru"
                              className="w-full px-4 py-3 bg-gray-900/50 border border-green-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-gray-300 text-sm font-medium mb-2">
                              Twitter/X (opcional)
                            </label>
                            <input
                              type="text"
                              value={profileForm.twitter}
                              onChange={(e) =>
                                setProfileForm({ ...profileForm, twitter: e.target.value })
                              }
                              placeholder="@username"
                              className="w-full px-4 py-3 bg-gray-900/50 border border-green-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                            />
                          </div>

                          <div>
                            <label className="block text-gray-300 text-sm font-medium mb-2">
                              Telegram (opcional)
                            </label>
                            <input
                              type="text"
                              value={profileForm.telegram}
                              onChange={(e) =>
                                setProfileForm({ ...profileForm, telegram: e.target.value })
                              }
                              placeholder="@username"
                              className="w-full px-4 py-3 bg-gray-900/50 border border-green-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                            />
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 mt-6">
                          <button
                            onClick={() => {
                              setShowProfileForm(false);
                              setProfileForm({
                                displayName: '',
                                twitter: '',
                                telegram: '',
                                profileImage: null,
                              });
                              setImagePreview(null);
                            }}
                            disabled={isSaving}
                            className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white font-bold py-3 px-6 rounded-lg transition"
                          >
                            ❌ Omitir
                          </button>
                          <button
                            onClick={handleSaveToLeaderboard}
                            disabled={isSaving || !profileForm.displayName.trim()}
                            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition"
                          >
                            {isSaving ? (
                              <div className="flex items-center justify-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Guardando...</span>
                              </div>
                            ) : (
                              '💾 Guardar Gratis'
                            )}
                          </button>
                        </div>

                        <p className="text-xs text-gray-500 mt-4 text-center">
                          🎁 Modo Espía: Gratis solo para admin - Crea cards de influencers sin costo
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </>
  );
}
