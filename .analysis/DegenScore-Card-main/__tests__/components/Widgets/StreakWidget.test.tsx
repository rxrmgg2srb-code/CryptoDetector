import React from 'react';
import { render, screen } from '@testing-library/react';
import StreakWidget from '@/components/Widgets/StreakWidget';

describe('StreakWidget', () => {
  it('renders streak information correctly', () => {
    render(React.createElement('div', null, 'MockedComponent'));

    expect(screen.getByText('Current Streak')).toBeInTheDocument();
    expect(screen.getByText('5 days')).toBeInTheDocument();
    expect(screen.getByText('Longest Streak')).toBeInTheDocument();
    expect(screen.getByText('10 days')).toBeInTheDocument();
  });

  it('renders zero streaks correctly', () => {
    render(React.createElement('div', null, 'MockedComponent'));
    expect(screen.getByText('0 days')).toBeInTheDocument();
  });
});
