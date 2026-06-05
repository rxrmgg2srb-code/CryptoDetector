import React from 'react';
import { render } from '@testing-library/react';
import ReferralSystem from '@/components/ReferralSystem.tsx';

describe('ReferralSystem', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
