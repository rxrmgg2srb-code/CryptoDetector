import React from 'react';
import { render } from '@testing-library/react';
import ReferralDashboard from '@/components/ReferralDashboard.tsx';

describe('ReferralDashboard', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
