import React, { useState, useEffect } from 'react';

interface OnboardingStep {
    title: string;
    description: string;
    icon: string;
    action?: string;
}

const STEPS: OnboardingStep[] = [
    {
        title: 'Conecta tu Wallet',
        description: 'Usa Phantom, Solflare o cualquier wallet compatible con Solana',
        icon: '🔗',
        action: 'Conectar',
    },
    {
        title: 'Analiza tu Trading',
        description: 'Escaneamos tu historial on-chain para calcular tu DegenScore',
        icon: '📊',
    },
    {
        title: 'Genera tu DegenCard',
        description: 'Obtén tu card personalizada y presume en Twitter',
        icon: '🎴',
    },
];

interface OnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConnect?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
    isOpen,
    onClose,
    onConnect,
}) => {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const currentStepData = STEPS[currentStep];
    if (!currentStepData) return null;

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onClose();
        }
    };

    const handleAction = () => {
        if (currentStep === 0 && onConnect) {
            onConnect();
        }
        handleNext();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative z-10 bg-gray-900 border border-purple-500/30 rounded-2xl p-8 max-w-md w-full mx-4 animate-scale-in">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                >
                    Saltar ✕
                </button>

                <div className="flex justify-center gap-2 mb-6">
                    {STEPS.map((_, index) => (
                        <div
                            key={index}
                            className={`w-2 h-2 rounded-full transition-colors ${index === currentStep
                                    ? 'bg-purple-500'
                                    : index < currentStep
                                        ? 'bg-purple-500/50'
                                        : 'bg-gray-600'
                                }`}
                        />
                    ))}
                </div>

                <div className="text-center">
                    <div className="text-6xl mb-4">{currentStepData.icon}</div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {currentStepData.title}
                    </h2>
                    <p className="text-gray-400 mb-8">{currentStepData.description}</p>

                    <button
                        onClick={handleAction}
                        className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 
              text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
                    >
                        {currentStepData.action || (currentStep === STEPS.length - 1 ? '¡Empezar!' : 'Siguiente')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const useOnboarding = () => {
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        const hasSeenOnboarding = localStorage.getItem('degenscore_onboarding_seen');
        if (!hasSeenOnboarding) {
            const timeout = setTimeout(() => setShowOnboarding(true), 2000);
            return () => clearTimeout(timeout);
        }
        return undefined;
    }, []);

    const completeOnboarding = () => {
        localStorage.setItem('degenscore_onboarding_seen', 'true');
        setShowOnboarding(false);
    };

    return { showOnboarding, setShowOnboarding, completeOnboarding };
};

export default OnboardingModal;
