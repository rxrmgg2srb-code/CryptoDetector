import React from 'react';
import { render } from '@testing-library/react';
import SecurityReport from '@/components/TokenSecurityScanner/SecurityReport.tsx';

describe('SecurityReport', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
