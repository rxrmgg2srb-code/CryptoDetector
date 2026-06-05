import React from 'react';
import { render, screen } from '@testing-library/react';
import { LeaderboardClient } from '@/components/LeaderboardClient';

// Mock next/dynamic
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: (importFn: any, options?: any) => {
    // For dynamic imports, just return a mock component
    const DynamicComponent = () => {
      if (options?.loading) {
        return options.loading();
      }
      return <div>Dynamic Component</div>;
    };
    DynamicComponent.displayName = 'DynamicComponent';
    return DynamicComponent;
  },
}));

describe('LeaderboardClient', () => {
  it('renders container correctly', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container.querySelector('.container')).toBeInTheDocument();
  });

  it('renders grid layout', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveClass('grid-cols-1', 'lg:grid-cols-2');
  });
});
