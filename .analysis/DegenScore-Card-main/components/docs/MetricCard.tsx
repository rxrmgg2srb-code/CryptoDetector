interface MetricLevel {
  range: string;
  label: string;
  emoji: string;
}

interface MetricCardProps {
  title: string;
  range: string;
  description: string;
  levels?: MetricLevel[];
}

export function MetricCard({ title, range, description, levels }: MetricCardProps) {
  return (
    <div className="bg-black/30 border border-gray-700 rounded-lg p-4">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-lg">{title}</h4>
        <span className="text-sm text-purple-400">{range}</span>
      </div>
      <p className="text-sm text-gray-400 mb-3">{description}</p>
      {levels && (
        <div className="space-y-1">
          {levels.map((level, i) => (
            <div key={i} className="flex justify-between text-xs">
              <span>
                {level.emoji} {level.label}
              </span>
              <span className="text-gray-500">{level.range}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export default MetricCard;
