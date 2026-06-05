interface CardGenerationProgressProps {
  message: string;
  progress: number;
}

export function CardGenerationProgress({ message, progress }: CardGenerationProgressProps) {
  return (
    <div className="space-y-6 bg-gray-900/50 p-8 rounded-2xl border border-cyan-500/30">
      <div className="flex justify-between items-center mb-3">
        <span className="text-lg text-gray-200 font-bold">{message}</span>
        <span className="text-xl text-cyan-300 font-black">{progress}%</span>
      </div>

      <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 transition-all duration-500 rounded-full shadow-[0_0_20px_rgba(34,211,238,0.8)]"
          style={{ width: `${progress}%` }}
        >
          <div className="h-full w-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse"></div>
        </div>
      </div>

      <div className="flex justify-center items-center gap-3 mt-6">
        <div
          className="w-4 h-4 bg-cyan-400 rounded-full animate-bounce shadow-[0_0_15px_rgba(34,211,238,0.8)]"
          style={{ animationDelay: '0ms' }}
        ></div>
        <div
          className="w-4 h-4 bg-blue-400 rounded-full animate-bounce shadow-[0_0_15px_rgba(59,130,246,0.8)]"
          style={{ animationDelay: '150ms' }}
        ></div>
        <div
          className="w-4 h-4 bg-purple-400 rounded-full animate-bounce shadow-[0_0_15px_rgba(168,85,247,0.8)]"
          style={{ animationDelay: '300ms' }}
        ></div>
      </div>
    </div>
  );
}
