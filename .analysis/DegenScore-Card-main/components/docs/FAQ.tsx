import { useState } from 'react';

export function FAQ({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-black/30 border border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-4 flex justify-between items-center hover:bg-gray-800/30 transition-colors"
      >
        <span className="font-medium">{question}</span>
        <span className="text-purple-400">{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && (
        <div className="p-4 pt-0 text-gray-400 text-sm border-t border-gray-800">{answer}</div>
      )}
    </div>
  );
}
