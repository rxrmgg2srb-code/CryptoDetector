import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { generateSessionToken } from '../lib/walletAuth';
import toast from 'react-hot-toast';
import { logger } from '../lib/logger';

interface NotificationPreferences {
  emailEnabled: boolean;
  telegramEnabled: boolean;
  discordEnabled: boolean;
  email?: string;
  telegramChatId?: string;
  discordWebhook?: string;
  followedTrades: boolean;
  milestones: boolean;
  challenges: boolean;
}

export default function NotificationSettings() {
  const { publicKey } = useWallet();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailEnabled: false,
    telegramEnabled: false,
    discordEnabled: false,
    followedTrades: true,
    milestones: true,
    challenges: true,
  });

  useEffect(() => {
    if (publicKey) {
      generateToken();
    }
  }, [publicKey]);

  useEffect(() => {
    if (sessionToken) {
      fetchPreferences();
    }
  }, [sessionToken]);

  const generateToken = () => {
    if (!publicKey) {
      return;
    }

    try {
      const token = generateSessionToken(publicKey.toBase58());
      setSessionToken(token);
    } catch (error) {
      logger.error('Failed to generate session token:', error as Error);
      toast.error('Failed to authenticate');
    }
  };

  const fetchPreferences = async () => {
    if (!sessionToken) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/notifications/preferences', {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch preferences');
      }

      const data = await response.json();
      setPreferences(data);
    } catch (error: any) {
      logger.error('Error fetching notification preferences:', error);
      toast.error('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!sessionToken) {
      toast.error('Please authenticate first');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save preferences');
      }

      toast.success('Preferences saved successfully!');
    } catch (error: any) {
      logger.error('Error saving notification preferences:', error);
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  if (!publicKey) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-6">
        <div className="text-center">
          <div className="text-5xl mb-3">🔔</div>
          <h3 className="text-xl font-bold text-white mb-2">Notification Settings</h3>
          <p className="text-gray-400">Connect your wallet to manage notification preferences</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-6 animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-16 bg-gray-700 rounded"></div>
          <div className="h-16 bg-gray-700 rounded"></div>
          <div className="h-16 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">🔔 Notifications</h3>
          <p className="text-gray-400 text-sm">
            Configure how you want to receive DegenScore notifications
          </p>
        </div>
      </div>

      {/* Notification Channels */}
      <div className="space-y-6 mb-6">
        {/* Discord */}
        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="text-2xl">💬</div>
              <div>
                <h4 className="text-white font-bold">Discord</h4>
                <p className="text-gray-400 text-xs">
                  Receive notifications on your Discord server
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.discordEnabled}
                onChange={(e) => updatePreference('discordEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
          {preferences.discordEnabled && (
            <input
              type="text"
              placeholder="https://discord.com/api/webhooks/..."
              value={preferences.discordWebhook || ''}
              onChange={(e) => updatePreference('discordWebhook', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:border-purple-500 focus:outline-none"
            />
          )}
        </div>

        {/* Telegram */}
        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="text-2xl">✈️</div>
              <div>
                <h4 className="text-white font-bold">Telegram</h4>
                <p className="text-gray-400 text-xs">Receive messages on Telegram</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.telegramEnabled}
                onChange={(e) => updatePreference('telegramEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
          {preferences.telegramEnabled && (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Tu Chat ID de Telegram"
                value={preferences.telegramChatId || ''}
                onChange={(e) => updatePreference('telegramChatId', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:border-purple-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500">
                Send /start to @DegenScoreBot to get your Chat ID
              </p>
            </div>
          )}
        </div>

        {/* Email */}
        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="text-2xl">📧</div>
              <div>
                <h4 className="text-white font-bold">Email</h4>
                <p className="text-gray-400 text-xs">Receive notifications by email</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.emailEnabled}
                onChange={(e) => updatePreference('emailEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
          {preferences.emailEnabled && (
            <input
              type="email"
              placeholder="tu@email.com"
              value={preferences.email || ''}
              onChange={(e) => updatePreference('email', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:border-purple-500 focus:outline-none"
            />
          )}
        </div>
      </div>

      {/* Notification Types */}
      <div className="border-t border-gray-700 pt-6 mb-6">
        <h4 className="text-white font-bold mb-4">Notification Types</h4>
        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="text-xl">📊</div>
              <div>
                <div className="text-white font-medium">Followed Trades</div>
                <div className="text-gray-400 text-xs">When a followed wallet makes a trade</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.followedTrades}
              onChange={(e) => updatePreference('followedTrades', e.target.checked)}
              className="w-5 h-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="text-xl">🎉</div>
              <div>
                <div className="text-white font-medium">Achievements and Milestones</div>
                <div className="text-gray-400 text-xs">When you reach a new achievement</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.milestones}
              onChange={(e) => updatePreference('milestones', e.target.checked)}
              className="w-5 h-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="text-xl">🏆</div>
              <div>
                <div className="text-white font-medium">Weekly Challenges</div>
                <div className="text-gray-400 text-xs">New challenges and results</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.challenges}
              onChange={(e) => updatePreference('challenges', e.target.checked)}
              className="w-5 h-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
            />
          </label>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={savePreferences}
        disabled={saving}
        className={`w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition ${
          saving ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {saving ? 'Saving...' : '💾 Save Preferences'}
      </button>
    </div>
  );
}
