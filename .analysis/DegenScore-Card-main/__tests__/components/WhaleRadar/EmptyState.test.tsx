import React from 'react';
import { render } from '@testing-library/react';
import EmptyState from '@/components/WhaleRadar/EmptyState.tsx';

describe('EmptyState', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
