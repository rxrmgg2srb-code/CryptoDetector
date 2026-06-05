interface CardPreviewProps {
  cardImage: string;
}

export function CardPreview({ cardImage }: CardPreviewProps) {
  return (
    <div className="mt-10">
      <div className="flex justify-center mb-8">
        <div className="relative group">
          <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-3xl opacity-30 group-hover:opacity-50 blur-xl transition-opacity"></div>
          <img
            src={cardImage}
            alt="Degen Card"
            className="relative rounded-2xl shadow-[0_0_60px_rgba(139,92,246,0.8)] border-4 border-cyan-400 max-w-full h-auto animate-flip holographic transform group-hover:scale-[1.02] transition-transform duration-300"
          />
        </div>
      </div>
    </div>
  );
}
