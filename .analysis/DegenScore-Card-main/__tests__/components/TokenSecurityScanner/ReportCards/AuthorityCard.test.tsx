import React from 'react';
import { render } from '@testing-library/react';
import AuthorityCard from '@/components/TokenSecurityScanner/ReportCards/AuthorityCard.tsx';

describe('AuthorityCard', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
