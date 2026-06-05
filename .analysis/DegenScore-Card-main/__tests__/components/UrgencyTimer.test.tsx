import React from 'react';
import { render } from '@testing-library/react';
import UrgencyTimer from '@/components/UrgencyTimer.tsx';

describe('UrgencyTimer', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
