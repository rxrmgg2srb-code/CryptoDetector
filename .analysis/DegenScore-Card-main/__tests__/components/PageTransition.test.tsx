import React from 'react';
import { render } from '@testing-library/react';
import PageTransition from '@/components/PageTransition';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => React.createElement('div', props, children),
    span: ({ children, ...props }) => React.createElement('span', props, children),
  },
  AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children),
}));

describe('PageTransition', () => {
  it('renders children correctly', () => {
    const { container } = render(
      <PageTransition>
        <div>Test Content</div>
      </PageTransition>
    );
    expect(container.textContent).toContain('Test Content');
  });

  it('renders with fade variant', () => {
    const { container } = render(
      <PageTransition variant="fade">
        <div>Fade Content</div>
      </PageTransition>
    );
    expect(container.textContent).toContain('Fade Content');
  });

  it('renders with slide variant', () => {
    const { container } = render(
      <PageTransition variant="slide">
        <div>Slide Content</div>
      </PageTransition>
    );
    expect(container.textContent).toContain('Slide Content');
  });

  it('renders with custom duration', () => {
    const { container } = render(
      <PageTransition duration={0.5}>
        <div>Custom Duration</div>
      </PageTransition>
    );
    expect(container.textContent).toContain('Custom Duration');
  });
});
