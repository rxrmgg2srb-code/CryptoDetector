import React, { useState } from 'react';
import { PRICING_OPTIONS, PaymentType } from '@/lib/pricing';

interface PricingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectTier: (type: PaymentType) => void;
    currentType?: PaymentType | null;
}

export const PricingModal: React.FC<PricingModalProps> = ({
    isOpen,
    onClose,
    onSelectTier,
    currentType = null,
}) => {
    // Default to Entry if no current type, otherwise Renewal
    const [selectedType, setSelectedType] = useState<PaymentType>(currentType === 'ENTRY' ? 'RENEWAL' : 'ENTRY');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-4xl w-full animate-scale-in">
                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">
                        Unlock Your Degen Potential 💎
                    </h2>
                    <p className="text-gray-400">
                        Lifetime Access + Seasonal Competitions
                    </p>
                </div>

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors text-xl"
                >
                    ✕
                </button>

                {/* Pricing Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                    {PRICING_OPTIONS.map((option) => (
                        <div
                            key={option.type}
                            className={`relative rounded-xl border-2 p-6 transition-all duration-200 cursor-pointer
                                ${selectedType === option.type
                                    ? `border-transparent ring-2 ring-offset-2 ring-offset-gray-900 ring-${option.color.split('-')[1]}-500 bg-gray-800`
                                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'}
                            `}
                            onClick={() => setSelectedType(option.type)}
                        >
                            {/* Popular Badge */}
                            {option.isPopular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full text-xs font-bold text-black shadow-lg">
                                    MOST POPULAR
                                </div>
                            )}

                            {/* Header */}
                            <div className="text-center mb-6">
                                <h3 className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${option.color}`}>
                                    {option.label}
                                </h3>
                                <div className="mt-2 flex items-baseline justify-center gap-1">
                                    <span className="text-4xl font-bold text-white">{option.price}</span>
                                    <span className="text-xl text-gray-400">SOL</span>
                                </div>
                                <p className="text-sm text-gray-400 mt-2 min-h-[40px] px-4">
                                    {option.description}
                                </p>
                            </div>

                            {/* Features */}
                            <ul className="space-y-3 mb-8">
                                {option.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-sm">
                                        <div className={`mt-0.5 rounded-full p-0.5 bg-gradient-to-r ${option.color}`}>
                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span className="text-gray-300">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectTier(option.type);
                                }}
                                className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg
                                    bg-gradient-to-r ${option.color} hover:shadow-${option.color.split('-')[1]}-500/25 hover:scale-[1.02] active:scale-[0.98]
                                    text-white
                                `}
                            >
                                {option.buttonText}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="text-center mt-8 space-y-2">
                    <p className="text-xs text-gray-500">
                        By connecting your wallet, you agree to our Terms of Service.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PricingModal;
