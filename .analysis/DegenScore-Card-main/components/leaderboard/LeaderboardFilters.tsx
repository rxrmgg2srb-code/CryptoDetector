import { SortBy, ViewMode } from './types';

interface LeaderboardFiltersProps {
  sortBy: SortBy;
  setSortBy: (sort: SortBy) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  searchWallet: string;
  setSearchWallet: (search: string) => void;
}

export const LeaderboardFilters = ({
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  searchWallet,
  setSearchWallet,
}: LeaderboardFiltersProps) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSortBy('newest')}
          className={`px-4 py-2 rounded-lg transition font-semibold ${
            sortBy === 'newest'
              ? 'bg-cyan-500 text-white shadow-lg'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          🆕 Newest
        </button>
        <button
          onClick={() => setSortBy('oldest')}
          className={`px-4 py-2 rounded-lg transition font-semibold ${
            sortBy === 'oldest'
              ? 'bg-cyan-500 text-white shadow-lg'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          ⏰ Oldest
        </button>

        <div className="hidden md:block w-px bg-gray-700 mx-1"></div>

        <button
          onClick={() => setSortBy('likes')}
          className={`px-4 py-2 rounded-lg transition font-semibold ${
            sortBy === 'likes'
              ? 'bg-pink-500 text-white shadow-lg'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          ❤️ Likes
        </button>
        <button
          onClick={() => setSortBy('referralCount')}
          className={`px-4 py-2 rounded-lg transition font-semibold ${
            sortBy === 'referralCount'
              ? 'bg-blue-500 text-white shadow-lg'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          👥 Referrals
        </button>
        <button
          onClick={() => setSortBy('badgePoints')}
          className={`px-4 py-2 rounded-lg transition font-semibold ${
            sortBy === 'badgePoints'
              ? 'bg-yellow-500 text-white shadow-lg'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          ⭐ Achievements
        </button>
      </div>

      <div className="flex gap-2 md:border-l md:border-gray-700 md:pl-4">
        <button
          onClick={() => setViewMode('cards')}
          className={`px-4 py-2 rounded-lg transition ${
            viewMode === 'cards'
              ? 'bg-purple-500 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          🎴 Cards
        </button>
        <button
          onClick={() => setViewMode('table')}
          className={`px-4 py-2 rounded-lg transition ${
            viewMode === 'table'
              ? 'bg-purple-500 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          📊 Table
        </button>
      </div>

      <input
        type="text"
        placeholder="Search wallet/name..."
        value={searchWallet}
        onChange={(e) => setSearchWallet(e.target.value)}
        className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
      />
    </div>
  );
};
