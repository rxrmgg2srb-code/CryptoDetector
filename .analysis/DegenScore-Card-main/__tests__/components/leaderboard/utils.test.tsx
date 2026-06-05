import React from 'react';
import { render } from '@testing-library/react';
import utils from '@/components/leaderboard/utils.ts';

describe('utils', () => {
  it('renders without crashing', () => {
    const { container } = render(<utils />);
    expect(container).toBeInTheDocument();
  });
});
