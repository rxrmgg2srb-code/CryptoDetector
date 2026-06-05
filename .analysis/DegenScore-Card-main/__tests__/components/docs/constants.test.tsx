import React from 'react';
import { render } from '@testing-library/react';
import constants from '@/components/docs/constants.ts';

describe('constants', () => {
  it('renders without crashing', () => {
    const { container } = render(<constants />);
    expect(container).toBeInTheDocument();
  });
});
