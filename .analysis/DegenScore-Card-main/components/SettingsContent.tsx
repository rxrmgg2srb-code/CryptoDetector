import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Lazy load notification settings
const NotificationSettings = dynamic(() => import('../components/NotificationSettings'), {
  loading: () => <div className="h-96 bg-gray-800/30 animate-pulse rounded-lg" />,
  ssr: false,
});

// Component only
export default function SettingsContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 relative overflow-hidden">
      {/* Animated background */}
      <div className="neon-streak"></div>

      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <button className="text-gray-400 hover:text-white transition">← Volver</button>
            </Link>
            <h1 className="text-3xl font-bold gradient-text-gold">⚙️ Configuración</h1>
          </div>
          <WalletMultiButton />
        </div>

        {/* Settings Content */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 gap-6">
            {/* Notification Settings */}
            <NotificationSettings />

            {/* Additional Settings Sections */}
            <div className="bg-gray-800/50 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">🔗 Enlaces Útiles</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link href="/following">
                  <div className="bg-gray-900/50 rounded-lg p-4 hover:bg-gray-900/70 transition cursor-pointer border border-gray-700 hover:border-purple-500">
                    <div className="text-2xl mb-2">👥</div>
                    <h4 className="text-white font-bold">Wallets Seguidas</h4>
                    <p className="text-gray-400 text-sm">Ver lista de wallets que sigues</p>
                  </div>
                </Link>

                <Link href="/leaderboard">
                  <div className="bg-gray-900/50 rounded-lg p-4 hover:bg-gray-900/70 transition cursor-pointer border border-gray-700 hover:border-purple-500">
                    <div className="text-2xl mb-2">🏆</div>
                    <h4 className="text-white font-bold">Leaderboard</h4>
                    <p className="text-gray-400 text-sm">Ver ranking global de traders</p>
                  </div>
                </Link>

                <Link href="/compare">
                  <div className="bg-gray-900/50 rounded-lg p-4 hover:bg-gray-900/70 transition cursor-pointer border border-gray-700 hover:border-purple-500">
                    <div className="text-2xl mb-2">⚔️</div>
                    <h4 className="text-white font-bold">Comparar Cards</h4>
                    <p className="text-gray-400 text-sm">Compara stats de dos wallets</p>
                  </div>
                </Link>

                <Link href="/documentation">
                  <div className="bg-gray-900/50 rounded-lg p-4 hover:bg-gray-900/70 transition cursor-pointer border border-gray-700 hover:border-purple-500">
                    <div className="text-2xl mb-2">📚</div>
                    <h4 className="text-white font-bold">Documentación</h4>
                    <p className="text-gray-400 text-sm">Aprende cómo funciona DegenScore</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Privacy & Security */}
            <div className="bg-gray-800/50 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">🔒 Privacidad y Seguridad</h3>
              <div className="space-y-3 text-sm text-gray-400">
                <p>
                  <strong className="text-white">🔐 Seguridad:</strong> Tu wallet es verificada
                  mediante firma criptográfica. Nunca compartimos tus claves privadas.
                </p>
                <p>
                  <strong className="text-white">📊 Datos:</strong> Solo analizamos transacciones
                  públicas de la blockchain. Tus datos de notificaciones son privados y encriptados.
                </p>
                <p>
                  <strong className="text-white">🔕 Control:</strong> You can disable notifications
                  at any time. Tus preferencias se guardan de forma segura.
                </p>
              </div>
            </div>

            {/* Support */}
            <div className="bg-gray-800/50 rounded-lg p-6 text-center">
              <div className="text-4xl mb-3">💬</div>
              <h3 className="text-xl font-bold text-white mb-2">¿Necesitas Ayuda?</h3>
              <p className="text-gray-400 mb-4">
                Si tienes preguntas o problemas, no dudes en contactarnos
              </p>
              <div className="flex justify-center gap-3">
                <a
                  href="https://twitter.com/degenscore"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                >
                  🐦 Twitter
                </a>
                <a
                  href="https://discord.gg/degenscore"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition"
                >
                  💬 Discord
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Force SSR to prevent build timeout
export async function getServerSideProps() {
  return {
    props: {},
  };
}
