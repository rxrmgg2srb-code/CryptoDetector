import React from 'react';
import { render } from '@testing-library/react';
import BadgeComponents from '@/components/docs/BadgeComponents.tsx';

describe('BadgeComponents', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
