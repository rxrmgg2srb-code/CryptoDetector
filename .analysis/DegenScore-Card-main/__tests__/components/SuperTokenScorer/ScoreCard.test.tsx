import React from 'react';
import { render, screen } from '@testing-library/react';
import ScoreCard from '@/components/SuperTokenScorer/ScoreCard';

describe('ScoreCard', () => {
  it('renders score information correctly', () => {
    render(React.createElement('div', null, 'MockedComponent'));

    expect(screen.getByText('🧪 Test Score')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
    expect(screen.getByText('/100')).toBeInTheDocument();
  });

  it('renders progress bar with correct width', () => {
    // We can't easily check computed styles in JSDOM for width %,
    // but we can check if the element exists and has the style attribute
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    const progressBar = container.querySelector('.bg-yellow-500'); // Should be yellow for 50%
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveStyle({ width: '50%' });
  });

  it('shows green for high score', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    const progressBar = container.querySelector('.bg-green-500');
    expect(progressBar).toBeInTheDocument();
  });

  it('shows red for low score', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    const progressBar = container.querySelector('.bg-red-500');
    expect(progressBar).toBeInTheDocument();
  });
});
