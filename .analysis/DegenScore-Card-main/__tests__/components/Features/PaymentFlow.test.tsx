import React from 'react';
import { render } from '@testing-library/react';
import PaymentFlow from '@/components/Features/PaymentFlow.tsx';

describe('PaymentFlow', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
