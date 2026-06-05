export function TierCard({ tier, price, features, highlight }: any) {
  return (
    <div
      className={`rounded-xl p-6 ${highlight ? 'bg-gradient-to-br from-purple-900/50 to-pink-900/50 border-2 border-purple-500' : 'bg-black/30 border border-gray-700'}`}
    >
      <h4 className="text-xl font-bold mb-2">{tier}</h4>
      <p className={`text-2xl font-bold mb-4 ${highlight ? 'text-purple-400' : 'text-gray-300'}`}>
        {price}
      </p>
      <ul className="space-y-2 text-sm">
        {features.map((f: string, i: number) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-purple-400">✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ReferralTier({
  count,
  title,
  rewards,
}: {
  count: number;
  title: string;
  rewards: string[];
}) {
  return (
    <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="bg-purple-600 rounded-full w-10 h-10 flex items-center justify-center font-bold">
          {count}
        </div>
        <h5 className="font-bold">{title}</h5>
      </div>
      <ul className="space-y-1 text-sm text-gray-300">
        {rewards.map((r, i) => (
          <li key={i}>• {r}</li>
        ))}
      </ul>
    </div>
  );
}

export function FeedDelayCard({
  tier,
  delay,
  highlight,
}: {
  tier: string;
  delay: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg p-4 text-center ${highlight ? 'bg-purple-900/50 border-2 border-purple-500' : 'bg-black/30 border border-gray-700'}`}
    >
      <p className="font-bold mb-1">{tier}</p>
      <p className={`text-2xl font-bold ${highlight ? 'text-purple-400' : 'text-gray-400'}`}>
        {delay}
      </p>
      <p className="text-xs text-gray-500 mt-1">delay</p>
    </div>
  );
}

export function TierRow({ feature, free, premium, pro }: any) {
  return (
    <tr className="border-b border-gray-800">
      <td className="p-3">{feature}</td>
      <td className="p-3 text-center text-gray-400">{free}</td>
      <td className="p-3 text-center text-purple-400">{premium}</td>
      <td className="p-3 text-center text-yellow-400">{pro}</td>
    </tr>
  );
}
