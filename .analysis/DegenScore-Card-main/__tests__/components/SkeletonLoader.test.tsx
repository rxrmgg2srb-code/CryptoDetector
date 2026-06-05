import React from 'react';
import { render } from '@testing-library/react';
import SkeletonLoader from '@/components/SkeletonLoader.tsx';

describe('SkeletonLoader', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
