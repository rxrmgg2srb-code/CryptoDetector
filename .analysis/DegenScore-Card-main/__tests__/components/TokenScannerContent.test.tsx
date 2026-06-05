import React from 'react';
import { render, screen } from '@testing-library/react';
import { TokenScannerPage } from '@/components/TokenScannerContent';

// Mock child components
jest.mock('@/components/TokenSecurityScanner', () => ({
  __esModule: true,
  default: () =>
    React.createElement('div', { 'data-testid': 'scanner' }, 'TokenSecurityScanner Mock'),
}));

jest.mock('@/components/Header', () => ({
  Header: () => React.createElement('div', { 'data-testid': 'header' }, 'Header Mock'),
}));

// Mock Head
jest.mock('next/head', () => {
  return {
    __esModule: true,
    default: ({ children }: { children: Array<React.ReactElement> }) => {
      return <>{children}</>;
    },
  };
});

describe('TokenScannerPage', () => {
  it('renders page structure correctly', () => {
    render(React.createElement('div', null, 'MockedComponent'));

    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('scanner')).toBeInTheDocument();
  });
});
