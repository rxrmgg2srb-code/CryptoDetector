import React from 'react';
import { render, screen } from '@testing-library/react';
import Analytics from '@/components/Analytics';

jest.mock('@/lib/logger', () => ({ logger: { error: jest.fn(), info: jest.fn() } }));

describe('Analytics', () => {
  it('renders analytics data', () => {
    const mockData = {
      totalUsers: 1000,
      activeUsers: 500,
      transactions: 250,
    };
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText('1000')).toBeInTheDocument();
  });
});
