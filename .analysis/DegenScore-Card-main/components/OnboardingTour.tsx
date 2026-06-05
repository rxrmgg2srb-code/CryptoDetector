/* eslint-disable react/no-unescaped-entities */
import { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';

interface OnboardingTourProps {
  onComplete?: () => void;
}

export default function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem('onboarding_completed');
    if (!hasCompletedOnboarding) {
      // Start tour after a short delay
      setTimeout(() => setRun(true), 1000);
    }
  }, []);

  const steps: Step[] = [
    {
      target: 'body',
      content: (
        <div className="p-4">
          <h3 className="text-2xl font-bold mb-3 text-gray-900">Welcome to DegenScore! 🚀</h3>
          <p className="text-gray-700 mb-4">
            Let's take a quick tour to show you how to generate your personalized trading card and
            unlock premium features!
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>⏱️</span>
            <span>This will only take 30 seconds</span>
          </div>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '.wallet-connect-button',
      content: (
        <div className="p-3">
          <h4 className="text-lg font-bold mb-2 text-gray-900">Connect Your Wallet 👛</h4>
          <p className="text-gray-700">
            First, connect your Solana wallet to analyze your trading history. We support Phantom,
            Solflare, and other popular wallets!
          </p>
        </div>
      ),
      placement: 'bottom',
      spotlightClicks: true,
    },
    {
      target: '.generate-card-button',
      content: (
        <div className="p-3">
          <h4 className="text-lg font-bold mb-2 text-gray-900">Generate Your Card 🎴</h4>
          <p className="text-gray-700">
            Click here to analyze your trading history and generate your personalized DegenScore
            card with real on-chain metrics!
          </p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '.card-display',
      content: (
        <div className="p-3">
          <h4 className="text-lg font-bold mb-2 text-gray-900">Your Trading Card ✨</h4>
          <p className="text-gray-700">
            Your card will display here with your DegenScore, trading stats, badges, and
            achievements. Each card is unique!
          </p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '.upgrade-premium',
      content: (
        <div className="p-3">
          <h4 className="text-lg font-bold mb-2 text-gray-900">Upgrade to Premium 💎</h4>
          <p className="text-gray-700 mb-3">
            Unlock exclusive features like custom profiles, advanced analytics, and special badges!
          </p>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 text-sm text-purple-800">
            <span className="font-semibold">Pro tip:</span> Premium users get priority leaderboard
            placement!
          </div>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.global-stats',
      content: (
        <div className="p-3">
          <h4 className="text-lg font-bold mb-2 text-gray-900">Global Stats 📊</h4>
          <p className="text-gray-700">
            See real-time stats of the entire DegenScore community, including total cards generated
            and trading volume!
          </p>
        </div>
      ),
      placement: 'left',
    },
    {
      target: '.activity-feed',
      content: (
        <div className="p-3">
          <h4 className="text-lg font-bold mb-2 text-gray-900">Live Activity 🔥</h4>
          <p className="text-gray-700">
            Watch as other traders generate their cards in real-time. Get inspired by high scores
            and achievements!
          </p>
        </div>
      ),
      placement: 'left',
    },
    {
      target: 'body',
      content: (
        <div className="p-4">
          <h3 className="text-2xl font-bold mb-3 text-gray-900">You're All Set! 🎉</h3>
          <p className="text-gray-700 mb-4">
            You're ready to generate your DegenScore card and join the community!
          </p>
          <div className="bg-gradient-to-r from-cyan-50 to-purple-50 border border-cyan-200 rounded-lg p-3 mb-3">
            <p className="text-sm text-gray-800 font-semibold mb-2">Quick Tips:</p>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Share your card on Twitter to earn badges</li>
              <li>• Refer friends to unlock premium features</li>
              <li>• Check the leaderboard to compete with others</li>
            </ul>
          </div>
          <p className="text-sm text-gray-600">
            You can restart this tour anytime from the help menu.
          </p>
        </div>
      ),
      placement: 'center',
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, index, type } = data;

    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
      // Tour completed or skipped
      setRun(false);
      localStorage.setItem('onboarding_completed', 'true');
      if (onComplete) {
        onComplete();
      }
    }

    // Update step index
    if (type === 'step:after') {
      setStepIndex(index + 1);
    }
  };

  const restartTour = () => {
    setStepIndex(0);
    setRun(true);
  };

  return (
    <>
      <Joyride
        steps={steps}
        run={run}
        stepIndex={stepIndex}
        continuous
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: '#22d3ee',
            textColor: '#1f2937',
            backgroundColor: '#ffffff',
            arrowColor: '#ffffff',
            overlayColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 10000,
          },
          buttonNext: {
            backgroundColor: '#22d3ee',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: 'bold',
          },
          buttonBack: {
            color: '#6b7280',
            marginRight: '12px',
          },
          buttonSkip: {
            color: '#6b7280',
          },
          tooltip: {
            borderRadius: '12px',
            padding: 0,
            fontSize: '15px',
          },
          tooltipContent: {
            padding: 0,
          },
        }}
        locale={{
          back: 'Back',
          close: 'Close',
          last: 'Finish',
          next: 'Next',
          skip: 'Skip Tour',
        }}
      />

      {/* Help button to restart tour */}
      <button
        onClick={restartTour}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white p-4 rounded-full shadow-2xl transition-all z-50 group"
        title="Restart Tour"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Need help? Restart tour
        </span>
      </button>
    </>
  );
}
