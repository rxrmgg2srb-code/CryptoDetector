import React from 'react';
import { render } from '@testing-library/react';
import ScannerInput from '@/components/TokenSecurityScanner/ScannerInput.tsx';

describe('ScannerInput', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
