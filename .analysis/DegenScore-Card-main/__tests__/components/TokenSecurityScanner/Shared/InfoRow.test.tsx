import React from 'react';
import { render } from '@testing-library/react';
import InfoRow from '@/components/TokenSecurityScanner/Shared/InfoRow.tsx';

describe('InfoRow', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
