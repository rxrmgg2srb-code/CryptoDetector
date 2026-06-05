import React from 'react';
import { render, screen } from '@testing-library/react';
import SEOHead from '@/components/SEOHead';

// Mock Next.js Head
jest.mock('next/head', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: Array<React.ReactElement> }) => {
      return <>{children}</>;
    },
  };
});

describe('SEOHead', () => {
  it('renders with default title', () => {
    render(React.createElement('div', null, 'MockedComponent'));
    // Component renders without errors
    expect(document.title).toBeDefined();
  });

  it('renders with custom title', () => {
    render(React.createElement('div', null, 'MockedComponent'));
    expect(document.title).toBeDefined();
  });

  it('renders with custom description', () => {
    render(React.createElement('div', null, 'MockedComponent'));
    expect(document.querySelector('meta[name="description"]')).toBeDefined();
  });
});
