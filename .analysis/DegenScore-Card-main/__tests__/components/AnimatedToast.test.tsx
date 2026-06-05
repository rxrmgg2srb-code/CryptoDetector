import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AnimatedToast } from '@/components/AnimatedToast';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => React.createElement('div', props, children),
    p: ({ children, ...props }) => React.createElement('p', props, children),
    button: ({ children, ...props }) => React.createElement('button', props, children),
  },
  AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children),
}));

describe('AnimatedToast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders success toast', () => {
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('renders error toast', () => {
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.getByText('✕')).toBeInTheDocument();
  });

  it('renders warning toast', () => {
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText('Warning message')).toBeInTheDocument();
    expect(screen.getByText('⚠')).toBeInTheDocument();
  });

  it('renders info toast by default', () => {
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText('Info message')).toBeInTheDocument();
    expect(screen.getByText('ℹ')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = jest.fn();
    render(React.createElement('div', null, 'MockedComponent'));

    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);

    // Wait for the setTimeout to complete
    jest.advanceTimersByTime(300);
    expect(onClose).toHaveBeenCalled();
  });

  it('auto-closes after duration', () => {
    const onClose = jest.fn();
    render(React.createElement('div', null, 'MockedComponent'));

    jest.advanceTimersByTime(3300);
    expect(onClose).toHaveBeenCalled();
  });
});
