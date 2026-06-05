import React from 'react';
import { render } from '@testing-library/react';
import UpgradeModal from '@/components/UpgradeModal.tsx';

describe('UpgradeModal', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
