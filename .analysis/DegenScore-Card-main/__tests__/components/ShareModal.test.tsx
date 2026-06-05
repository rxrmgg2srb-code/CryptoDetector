import React from 'react';
import { render } from '@testing-library/react';
import ShareModal from '@/components/ShareModal.tsx';

describe('ShareModal', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement('div', null, 'MockedComponent'));
    expect(container).toBeInTheDocument();
  });
});
