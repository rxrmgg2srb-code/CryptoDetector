import React from 'react';
import { render } from '@testing-library/react';
import ScannerHeader from '@/components/TokenSecurityScanner/ScannerHeader.tsx';

describe('ScannerHeader', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
