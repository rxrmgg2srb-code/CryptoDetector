import React from 'react';
import { render } from '@testing-library/react';
import index from '@/components/animations/index.ts';

describe('index', () => {
  it('renders without crashing', () => {
    const { container } = render(<index />);
    expect(container).toBeInTheDocument();
  });
});
