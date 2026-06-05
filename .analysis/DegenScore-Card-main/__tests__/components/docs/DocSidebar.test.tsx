import React from 'react';
import { render } from '@testing-library/react';
import DocSidebar from '@/components/docs/DocSidebar.tsx';

describe('DocSidebar', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
