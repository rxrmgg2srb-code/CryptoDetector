import React from 'react';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Mock logger
jest.mock('@/lib/logger');

describe('ErrorBoundary - Additional Tests', () => {
  const ThrowError = ({ error }: { error?: Error }) => {
    if (error) throw error;
    return <div>No error</div>;
  };

  it('should render children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Success content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Success content')).toBeInTheDocument();
  });

  it('should catch and display errors', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();

    render(
      <ErrorBoundary>
        <ThrowError error={new Error('Test error')} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    consoleError.mockRestore();
  });

  it('should display error message', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();

    render(
      <ErrorBoundary>
        <ThrowError error={new Error('Specific error message')} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Specific error message/i)).toBeInTheDocument();
    consoleError.mockRestore();
  });

  it('should handle non-Error exceptions', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();

    const ThrowString = () => {
      throw 'String error';
    };

    render(
      <ErrorBoundary>
        <ThrowString />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    consoleError.mockRestore();
  });

  it('should handle errors in nested components', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();

    const NestedComponent = () => (
      <div>
        <ThrowError error={new Error('Nested error')} />
      </div>
    );

    render(
      <ErrorBoundary>
        <NestedComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Nested error/i)).toBeInTheDocument();
    consoleError.mockRestore();
  });
});
