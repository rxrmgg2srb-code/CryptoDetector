import React from 'react';
import { render, screen } from '@testing-library/react';
import OnboardingTour from '@/components/OnboardingTour';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => React.createElement('div', props, children),
  },
  AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children),
}));

describe('OnboardingTour', () => {
  it('renders when isOpen is true', () => {
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText(/Welcome/i)).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container.firstChild).toBeNull();
  });
});
