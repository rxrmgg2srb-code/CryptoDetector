/* eslint-disable react/no-unescaped-entities */
export function Testimonials() {
  return (
    <div className="mb-16">
      <h2 className="text-4xl md:text-5xl font-black text-center text-white mb-12">
        What Traders Say
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <TestimonialCard
          quote="DegenScore is insane! Finally, I can prove to my friends that I'm not just gambling. The leaderboard keeps me competitive every day."
          author="@sol_degen_king"
          score={92}
          avatar="🦍"
        />

        <TestimonialCard
          quote="The analytics are next level. I discovered I was holding meme coins way too long. Changed my strategy and increased my win rate by 15%!"
          author="@moonshot_hunter"
          score={87}
          avatar="🚀"
        />

        <TestimonialCard
          quote="Love the NFT badges! Just unlocked Diamond Hands. Sharing my card on Twitter brought 50+ followers who also joined. Viral!"
          author="@crypto_whale_87"
          score={95}
          avatar="💎"
        />
      </div>
    </div>
  );
}

interface TestimonialCardProps {
  quote: string;
  author: string;
  score: number;
  avatar: string;
}

function TestimonialCard({ quote, author, score, avatar }: TestimonialCardProps) {
  return (
    <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30 shadow-lg hover:shadow-purple-500/40 transition-all duration-300 hover:scale-[1.02]">
      <div className="flex items-start gap-4 mb-4">
        <div className="text-5xl">{avatar}</div>
        <div className="flex-1">
          <div className="text-cyan-400 font-mono text-sm font-semibold">{author}</div>
          <div className="text-gray-400 text-xs mt-1">
            DegenScore: <span className="text-green-400 font-bold">{score}</span>/100
          </div>
        </div>
      </div>

      <p className="text-gray-300 text-base leading-relaxed italic">"{quote}"</p>

      <div className="mt-4 flex gap-1">
        {[...Array(5)].map((_, i) => (
          <span key={i} className="text-yellow-400 text-lg">
            ⭐
          </span>
        ))}
      </div>
    </div>
  );
}
