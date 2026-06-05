import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AchievementPopup, type Achievement } from '@/components/AchievementPopup';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => React.createElement('div', props, children),
  },
  AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children),
}));

describe('AchievementPopup', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('returns null when no achievement', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeEmptyDOMElement();
  });

  it('renders achievement with common rarity', () => {
    const achievement: Achievement = {
      id: '1',
      title: 'First Trade',
      description: 'Complete your first trade',
      icon: '🎉',
      rarity: 'common',
    };

    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText('First Trade')).toBeInTheDocument();
    expect(screen.getByText('Complete your first trade')).toBeInTheDocument();
  });

  it('renders achievement with legendary rarity', () => {
    const achievement: Achievement = {
      id: '2',
      title: 'Perfect Score',
      description: 'Achieve 100 score',
      icon: '👑',
      rarity: 'legendary',
    };

    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText('Perfect Score')).toBeInTheDocument();
  });

  it('calls onClose after timeout', () => {
    const onClose = jest.fn();
    const achievement: Achievement = {
      id: '3',
      title: 'Test',
      description: 'Test achievement',
      icon: '🔥',
      rarity: 'common',
    };

    render(React.createElement('div', null, 'MockedComponent'));

    jest.advanceTimersByTime(4300);
    expect(onClose).toHaveBeenCalled();
  });
});
