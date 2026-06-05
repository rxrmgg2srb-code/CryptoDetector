const fs = require('fs');
const path = require('path');

const componentsToCreate = [
  // Main components
  { file: 'components/Dashboard.tsx', name: 'Dashboard', props: '{ userId?: string }' },
  {
    file: 'components/PaymentButton.tsx',
    name: 'PaymentButton',
    props: '{ amount: number; onSuccess?: () => void }',
  },
  {
    file: 'components/ProfileFormModal.tsx',
    name: 'ProfileFormModal',
    props: '{ isOpen: boolean; onClose: () => void }',
  },
  {
    file: 'components/RealtimeLeaderboard.tsx',
    name: 'RealtimeLeaderboard',
    props: '{ limit?: number }',
  },
  {
    file: 'components/ScarcityBanner.tsx',
    name: 'ScarcityBanner',
    props: '{ slotsRemaining: number }',
  },
  { file: 'components/ScoreHistoryChart.tsx', name: 'ScoreHistoryChart', props: '{ data: any[] }' },
  {
    file: 'components/SEOHead.tsx',
    name: 'SEOHead',
    props: '{ title: string; description: string }',
  },
  { file: 'components/SettingsContent.tsx', name: 'SettingsContent', props: '{}' },
  {
    file: 'components/ReferralDashboard.tsx',
    name: 'ReferralDashboard',
    props: '{ userId: string }',
  },
  {
    file: 'components/OnboardingTour.tsx',
    name: 'OnboardingTour',
    props: '{ onComplete: () => void }',
  },
  { file: 'components/NotificationSettings.tsx', name: 'NotificationSettings', props: '{}' },
  {
    file: 'components/HeroButton.tsx',
    name: 'HeroButton',
    props: '{ children: React.ReactNode; onClick?: () => void }',
  },
  { file: 'components/FollowingContent.tsx', name: 'FollowingContent', props: '{}' },
  {
    file: 'components/FollowButton.tsx',
    name: 'FollowButton',
    props: '{ userId: string; isFollowing: boolean }',
  },
  {
    file: 'components/ErrorBoundary.tsx',
    name: 'ErrorBoundary',
    props: '{ children: React.ReactNode }',
    isClass: true,
  },
  {
    file: 'components/EnhancedSkeletonLoader.tsx',
    name: 'EnhancedSkeletonLoader',
    props: '{ count?: number }',
  },
  {
    file: 'components/DegenCardRefactored.tsx',
    name: 'DegenCardRefactored',
    props: '{ data: any }',
  },

  // Widgets
  {
    file: 'components/Widgets/HotFeedWidget.tsx',
    name: 'HotFeedWidget',
    props: '{ items: any[] }',
  },

  // Modals
  {
    file: 'components/Modals/ShareModal.tsx',
    name: 'ShareModal',
    props: '{ isOpen: boolean; onClose: () => void; url: string }',
  },
  {
    file: 'components/Modals/UpgradeModal.tsx',
    name: 'UpgradeModal',
    props: '{ isOpen: boolean; onClose: () => void }',
  },
  {
    file: 'components/Modals/ProfileModal.tsx',
    name: 'ProfileModal',
    props: '{ isOpen: boolean; onClose: () => void }',
  },

  // Features
  { file: 'components/Features/PaymentFlow.tsx', name: 'PaymentFlow', props: '{}' },
  { file: 'components/Features/ReferralSystem.tsx', name: 'ReferralSystem', props: '{}' },
  { file: 'components/Features/AnalyticsDashboard.tsx', name: 'AnalyticsDashboard', props: '{}' },
];

let created = 0;
let skipped = 0;

componentsToCreate.forEach(({ file, name, props, isClass }) => {
  const fullPath = path.join(
    'c:/Users/dscanales/Documents/DegenScore-Card/DegenScore-Card-1',
    file
  );
  const dir = path.dirname(fullPath);

  // Create directory if doesn't exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Skip if file exists
  if (fs.existsSync(fullPath)) {
    console.log(`⏭️  Skipped (exists): ${file}`);
    skipped++;
    return;
  }

  let content;

  if (isClass) {
    // Create class component
    content = `import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ${name}Props ${props}

interface ${name}State {
    hasError: boolean;
    error?: Error;
}

class ${name} extends Component<${name}Props, ${name}State> {
    constructor(props: ${name}Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ${name}State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary">
                    <h2>Something went wrong</h2>
                    <p>{this.state.error?.message}</p>
                </div>
            );
        }

        return this.props.children;
    }
}

export { ${name} };
export default ${name};
`;
  } else {
    // Create functional component
    content = `import React from 'react';

interface ${name}Props ${props}

function ${name}(props: ${name}Props) {
    return (
        <div className="${name
          .toLowerCase()
          .replace(/([A-Z])/g, '-$1')
          .toLowerCase()}">
            <h2>${name}</h2>
            <pre>{JSON.stringify(props, null, 2)}</pre>
        </div>
    );
}

export default ${name};
`;
  }

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✅ Created: ${file}`);
  created++;
});

console.log(`\n📊 Summary:`);
console.log(`✅ Created: ${created}`);
console.log(`⏭️  Skipped: ${skipped}`);
console.log(`📦 Total: ${componentsToCreate.length}`);
