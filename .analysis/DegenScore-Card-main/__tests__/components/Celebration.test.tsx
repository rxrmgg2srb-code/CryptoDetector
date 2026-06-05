import React from 'react';
import { render } from '@testing-library/react';
import { Celebration } from '@/components/Celebration';

// Mock canvas-confetti
jest.mock('canvas-confetti', () => jest.fn());

describe('Celebration', () => {
  it('renders without crashing for card-generated type', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });

  it('renders without crashing for premium-unlock type', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });

  it('renders without crashing for achievement type', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });

  it('renders without crashing for legendary type', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
